import httpx
from anthropic import Anthropic
from config import settings
from models.analysis import SuggestedSource, Issue, DomainContext
from typing import List
from datetime import datetime
import json
from urllib.parse import urlparse


class ResearchService:
    """Service for performing AI-powered research to find authoritative sources"""
    
    def __init__(self):
        self.claude_client = Anthropic(api_key=settings.claude_api_key)
        self.perplexity_api_key = settings.perplexity_api_key
        self.perplexity_base_url = "https://api.perplexity.ai"
    
    async def generate_research_query(self, issue: Issue, context: DomainContext) -> str:
        """
        Use Claude to generate an optimized search query based on the issue
        """
        current_date = datetime.now().strftime("%B %d, %Y")
        
        # Sanitize inputs to prevent prompt injection
        clean_description = issue.description[:500].replace('"', ' ').replace('\n', ' ')
        clean_text = issue.flagged_text[:500].replace('"', ' ').replace('\n', ' ')
        clean_reasoning = issue.reasoning[:500].replace('"', ' ').replace('\n', ' ')
        
        prompt = f"""You are a research assistant helping to find current, authoritative information.

Current Date: {current_date}

Domain Context:
- Description: {context.description}
- Entity Types: {context.entity_types}
- Staleness Rules: {context.staleness_rules}

Issue Detected:
- Description: {clean_description}
- Flagged Text: {clean_text}
- Reasoning: {clean_reasoning}

Task: Generate a specific, targeted search query to find the most current, official data that would resolve this issue.

Guidelines:
1. Focus on finding primary sources (government data, official statistics, industry reports)
2. Include relevant time qualifiers (e.g., "2025", "current", "latest")
3. Be specific about what data is needed
4. Keep the query concise (under 15 words)

Return ONLY the search query text, nothing else."""

        try:
            message = self.claude_client.messages.create(
                model="claude-3-haiku-20240307",
                max_tokens=100,
                messages=[{"role": "user", "content": prompt}]
            )
            
            query = message.content[0].text.strip()
            print(f"[DEBUG] Generated research query: {query}")
            return query
            
        except Exception as e:
            print(f"[ERROR] Failed to generate query: {str(e)}")
            # Fallback to a simple query
            return f"current {issue.flagged_text.replace('\"', '')}"
    
    async def perform_research(self, query: str) -> List[SuggestedSource]:
        """
        Use Perplexity API to search for authoritative sources
        """
        try:
            headers = {
                "Authorization": f"Bearer {self.perplexity_api_key}",
                "Content-Type": "application/json"
            }
            
            # Use Perplexity's sonar model for search with citations
            payload = {
                "model": "sonar",
                "messages": [
                    {
                        "role": "system",
                        "content": """You are a rigorous research assistant for a content audit tool. Your goal is to find high-authority sources to correct factual errors.

STRICT GUIDELINES:
1. PRIORITIZE official government data (.gov), academic institutions (.edu), and primary industry reports
2. EXCLUDE forums, social media (Reddit, Twitter), opinion blogs, and user-generated content
3. Focus on sources published within the last 12 months when possible
4. Provide direct quotes that prove the fact

Return your response as a JSON array with this exact structure:
[
  {
    "url": "direct link to the page",
    "title": "page title",
    "snippet": "direct quote proving the fact",
    "date": "publication date in YYYY-MM-DD format if available",
    "confidence": "High or Medium based on domain authority"
  }
]

Limit to 3-5 highest quality sources. Return ONLY valid JSON."""
                    },
                    {
                        "role": "user",
                        "content": f"Find authoritative sources for: {query}"
                    }
                ],
                "max_tokens": 1500,
                "temperature": 0.2,
                "return_citations": True,
                "return_images": False
            }
            
            print(f"[DEBUG] Calling Perplexity API with query: {query}")
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.perplexity_base_url}/chat/completions",
                    headers=headers,
                    json=payload
                )
                
                if response.status_code != 200:
                    print(f"[ERROR] Perplexity API error: {response.status_code} - {response.text}")
                    return []
                
                data = response.json()
                print(f"[DEBUG] Perplexity API response received")
                
                # Extract the response content
                content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                citations = data.get("citations", [])
                
                print(f"[DEBUG] Response content length: {len(content)}")
                print(f"[DEBUG] Citations count: {len(citations)}")
                
                # Try to parse JSON from the response
                sources = self._parse_sources_from_response(content, citations)
                
                print(f"[DEBUG] Parsed {len(sources)} sources")
                return sources
                
        except Exception as e:
            print(f"[ERROR] Research failed: {str(e)}")
            import traceback
            print(f"[ERROR] Traceback: {traceback.format_exc()}")
            return []
    
    def _parse_sources_from_response(self, content: str, citations: List[str]) -> List[SuggestedSource]:
        """
        Parse sources from Perplexity response
        """
        sources = []
        
        try:
            # Try to extract JSON array from content
            start_idx = content.find('[')
            end_idx = content.rfind(']') + 1
            
            if start_idx != -1 and end_idx > start_idx:
                json_str = content[start_idx:end_idx]
                sources_data = json.loads(json_str)
                
                for source_data in sources_data[:5]:  # Limit to 5 sources
                    try:
                        url = source_data.get("url", "")
                        domain = urlparse(url).netloc if url else ""
                        
                        source = SuggestedSource(
                            url=url,
                            title=source_data.get("title", ""),
                            snippet=source_data.get("snippet", ""),
                            publicationDate=source_data.get("date"),
                            domain=domain,
                            confidence=source_data.get("confidence", "Medium"),
                            isAccepted=False
                        )
                        sources.append(source)
                    except Exception as e:
                        print(f"[WARNING] Failed to parse source: {str(e)}")
                        continue
            
            # If JSON parsing failed or no sources, try to use citations
            if not sources and citations:
                print(f"[DEBUG] Using citations as fallback")
                for citation in citations[:5]:
                    try:
                        domain = urlparse(citation).netloc if citation else ""
                        sources.append(SuggestedSource(
                            url=citation,
                            title=domain or "Source",
                            snippet="",
                            domain=domain,
                            confidence="Medium",
                            isAccepted=False
                        ))
                    except Exception as e:
                        print(f"[WARNING] Failed to parse citation: {str(e)}")
                        continue
                        
        except json.JSONDecodeError as e:
            print(f"[WARNING] JSON decode error: {str(e)}")
            # Use citations as fallback
            if citations:
                for citation in citations[:5]:
                    try:
                        domain = urlparse(citation).netloc if citation else ""
                        sources.append(SuggestedSource(
                            url=citation,
                            title=domain or "Source",
                            snippet="",
                            domain=domain,
                            confidence="Medium",
                            isAccepted=False
                        ))
                    except Exception as e:
                        continue
        
        return sources
    
    async def research_issue(self, issue: Issue, context: DomainContext) -> List[SuggestedSource]:
        """
        Complete research workflow: generate query and perform search
        """
        print(f"[DEBUG] Starting research for issue: {issue.id}")
        
        # Generate optimized search query
        query = await self.generate_research_query(issue, context)
        
        # Perform research
        sources = await self.perform_research(query)
        
        print(f"[DEBUG] Research complete. Found {len(sources)} sources")
        return sources


# Singleton instance
research_service = ResearchService()