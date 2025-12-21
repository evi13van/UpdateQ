from anthropic import Anthropic
from config import settings
from datetime import datetime
import json
import uuid


async def detect_stale_content(url: str, content: str, domain_context: dict) -> dict:
    """
    Analyze content for factual decay using Claude API
    Returns dict with issues array
    """
    try:
        client = Anthropic(api_key=settings.claude_api_key)
        
        current_date = datetime.now().strftime("%B %d, %Y")
        
        # Construct prompt
        prompt = f"""You are analyzing web content for factual decay and outdated information.

Current Date: {current_date}

Domain Context:
- Description: {domain_context.get('description', '')}
- Entity Types to Check: {domain_context.get('entityTypes', '')}
- Staleness Rules: {domain_context.get('stalenessRules', '')}

Content to Analyze:
{content[:8000]}

Instructions:
1. Identify specific factual claims that are outdated or stale based on the domain context
2. Focus on dates, statistics, rates, deadlines, and time-sensitive information
3. Do NOT flag valid historical references (e.g., "Founded in 2020" is fine)
4. Return ONLY plain text descriptions without any HTML, markdown, or JSON formatting
5. Each issue should be a complete, readable sentence

Return a JSON array of issues in this exact format:
[
  {{
    "description": "Plain text description of the issue",
    "flaggedText": "The exact text from the content that is outdated",
    "reasoning": "Plain text explanation of why this is stale"
  }}
]

If no issues found, return an empty array: []
"""

        # Call Claude API
        message = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=2000,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        # Parse response
        response_text = message.content[0].text.strip()
        
        # Extract JSON from response
        try:
            # Try to find JSON array in response
            start_idx = response_text.find('[')
            end_idx = response_text.rfind(']') + 1
            
            if start_idx != -1 and end_idx > start_idx:
                json_str = response_text[start_idx:end_idx]
                issues_data = json.loads(json_str)
            else:
                issues_data = []
            
            # Add unique IDs to issues
            issues = []
            for issue in issues_data:
                issues.append({
                    "id": f"issue_{uuid.uuid4().hex[:8]}",
                    "description": issue.get("description", ""),
                    "flaggedText": issue.get("flaggedText", ""),
                    "reasoning": issue.get("reasoning", ""),
                    "status": "open"
                })
            
            return {
                "status": "success",
                "issues": issues,
                "issue_count": len(issues)
            }
            
        except json.JSONDecodeError:
            # If JSON parsing fails, return empty issues
            return {
                "status": "success",
                "issues": [],
                "issue_count": 0
            }
            
    except Exception as e:
        return {
            "status": "failed",
            "error": f"Analysis failed: {str(e)}",
            "issues": [],
            "issue_count": 0
        }