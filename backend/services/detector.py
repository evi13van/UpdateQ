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
        
        # Get staleness rules from user configuration
        staleness_rules = domain_context.get('stalenessRules', '')
        
        current_date = datetime.now().strftime("%B %d, %Y")
        current_year = datetime.now().year
        
        # Construct prompt
        content_preview = content[:8000] if len(content) > 8000 else content
        print(f"[DEBUG] Sending {len(content_preview)} chars to Claude (out of {len(content)} total)")
        
        prompt = f"""You are a content auditor specializing in temporal accuracy and stale information detection.

ANALYSIS PARAMETERS:
- Current Reference Date: {current_date}
- Current Year: {current_year}

STRICT EVALUATION PROCESS (Follow this order):

STEP 1 - IDENTIFY: Locate all date references (absolute or relative) in the text.

STEP 2 - RESOLVE CONTEXT:
   - If a month/day appears WITHOUT a year (e.g., "November", "March 15"), you MUST scan the surrounding text, headers, title, or byline to find the applicable year.
   - Look for patterns like "November 21, 2025" or "Published: 2025" or "2025 Guide" in the content.
   - If the title or header contains "{current_year}" or a future year, assume that year applies to ambiguous dates.
   - DO NOT assume an isolated month name refers to a past occurrence.

STEP 3 - CALCULATE AGE:
   - Determine the precise age of the information relative to {current_date}.
   - Example: If today is December 28, 2025 and content shows "November 21, 2025", the age is approximately 1 month (CURRENT).
   - Example: If today is December 28, 2025 and content shows "November 2023", the age is over 2 years (STALE).

STEP 4 - APPLY USER'S STALENESS RULES USING NATURAL LANGUAGE UNDERSTANDING:
   - The user has specified these staleness rules: "{staleness_rules}"
   - Interpret these rules using natural language understanding relative to {current_date}.
   - Examples of rule interpretation:
     * "older than 6 months" means content dated before approximately 6 months ago from {current_date}
     * "older than 2 years" means content dated before approximately 2 years ago from {current_date}
     * "immediate" or "current only" means any past date should be flagged
     * "pre-2024 data" means content referencing years before 2024
   - **FUTURE DATES**: Any date in the future relative to {current_date} is CURRENT. DO NOT FLAG.
   - **RECENT DATES**: Apply the user's natural language rules to determine if content is recent enough.
   - **STALE DATES**: Flag content that violates the user's staleness rules based on your semantic understanding.

Domain Context:
- Description: {domain_context.get('description', '')}
- Entity Types to Check: {domain_context.get('entityTypes', '')}
- Staleness Rules: {staleness_rules}

Content to Analyze:
{content_preview}

CRITICAL RULES:
- If you see "November" and the year is {current_year} or later, that is NEW content. DO NOT FLAG IT.
- Interpret the user's staleness rules ("{staleness_rules}") semantically - understand phrases like "older than X months/years" relative to {current_date}.
- Do NOT flag valid historical references that are clearly historical (e.g., "Founded in 2020" in a company history section).
- When in doubt about a date's year, look for contextual clues in titles, headers, and surrounding text before making assumptions.
- Respect the user's natural language staleness rules strictly by understanding their intent.

Return a JSON array of legitimate staleness issues. Each issue must be a JSON object with these exact fields:
[
  {{
    "description": "Clear description of what is stale",
    "flaggedText": "The exact quote from the content that is outdated",
    "contextExcerpt": "A three-sentence excerpt: the sentence immediately before the issue, the sentence containing the issue (with the problematic text wrapped in **bold markdown**), and the sentence immediately after. If there is no preceding or following sentence, include what is available.",
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
                    "contextExcerpt": issue.get("contextExcerpt", ""),
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