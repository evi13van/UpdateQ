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
    print(f"[DEBUG] detect_stale_content called for {url}")
    print(f"[DEBUG] Content length: {len(content)}")
    print(f"[DEBUG] Domain context: {domain_context}")
    
    try:
        print(f"[DEBUG] Initializing Claude client...")
        client = Anthropic(api_key=settings.claude_api_key)
        
        current_date = datetime.now().strftime("%B %d, %Y")
        
        # Construct prompt
        content_preview = content[:8000] if len(content) > 8000 else content
        print(f"[DEBUG] Sending {len(content_preview)} chars to Claude (out of {len(content)} total)")
        
        prompt = f"""You are analyzing web content for factual decay and outdated information.

Current Date: {current_date}

Domain Context:
- Description: {domain_context.get('description', '')}
- Entity Types to Check: {domain_context.get('entityTypes', '')}
- Staleness Rules: {domain_context.get('stalenessRules', '')}

Content to Analyze:
{content_preview}

Instructions:
1. Carefully analyze the content for outdated information based on the domain context and staleness rules
2. Look for dates, statistics, rates, deadlines, and time-sensitive information that is stale
3. Flag any references to past years (like 2022, 2023) when they appear in contexts suggesting they are current or recent
4. Flag statistics, rates, or data that are explicitly dated from previous years
5. Do NOT flag valid historical references that are clearly historical (e.g., "Founded in 2020" in a company history section)
6. Be thorough - if content mentions specific years that have passed, consider whether those references suggest the information is current when it's actually outdated

Return a JSON array of issues. Each issue must be a JSON object with these exact fields:
[
  {{
    "description": "Clear description of what is stale",
    "flaggedText": "The exact quote from the content that is outdated",
    "reasoning": "Explanation of why this is considered stale based on the rules"
  }}
]

If no stale information is found, return an empty array: []

IMPORTANT: Return ONLY valid JSON. Do not include any explanatory text before or after the JSON array.
"""

        # Call Claude API
        print(f"[DEBUG] Calling Claude API...")
        print(f"[DEBUG] Prompt length: {len(prompt)}")
        message = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=2000,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        print(f"[DEBUG] Claude API call successful")
        
        # Parse response
        response_text = message.content[0].text.strip()
        
        # Debug logging
        print(f"[DEBUG] Claude API Response for {url}:")
        print(f"[DEBUG] Response length: {len(response_text)}")
        print(f"[DEBUG] First 500 chars: {response_text[:500]}")
        
        # Extract JSON from response
        try:
            # Try to find JSON array in response
            start_idx = response_text.find('[')
            end_idx = response_text.rfind(']') + 1
            
            if start_idx != -1 and end_idx > start_idx:
                json_str = response_text[start_idx:end_idx]
                print(f"[DEBUG] Extracted JSON: {json_str[:500]}")
                issues_data = json.loads(json_str)
                print(f"[DEBUG] Parsed {len(issues_data)} issues")
            else:
                print(f"[DEBUG] No JSON array found in response")
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
            
        except json.JSONDecodeError as e:
            # If JSON parsing fails, return empty issues
            print(f"[DEBUG] JSON decode error: {str(e)}")
            print(f"[DEBUG] Full response: {response_text}")
            return {
                "status": "success",
                "issues": [],
                "issue_count": 0
            }
            
    except Exception as e:
        print(f"[ERROR] Exception in detect_stale_content: {type(e).__name__}: {str(e)}")
        import traceback
        print(f"[ERROR] Traceback: {traceback.format_exc()}")
        return {
            "status": "failed",
            "error": f"Analysis failed: {str(e)}",
            "issues": [],
            "issue_count": 0
        }