from anthropic import Anthropic
from config import settings
from datetime import datetime
import json
import uuid
import re

def is_heading_only(text: str) -> bool:
    """
    Detect if text is just a heading/title without specific content.
    Returns True if text appears to be a heading rather than actual content.
    """
    if not text or len(text.strip()) == 0:
        return True
    
    text = text.strip()
    
    # Check for heading patterns
    heading_patterns = [
        r'^[A-Z][a-zA-Z\s\-]+$',  # Title Case Without Punctuation
        r'^#+\s+',  # Markdown heading
        r'^[A-Z\s]+$',  # ALL CAPS
        r'^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*$',  # Proper Title Case
    ]
    
    # Headings are typically short (6 words or less)
    word_count = len(text.split())
    if word_count <= 6:
        for pattern in heading_patterns:
            if re.match(pattern, text):
                return True
    
    # Check if it's just a section title without punctuation
    if word_count <= 8 and not any(char in text for char in '.!?,;:'):
        # Likely a heading if it's short and has no punctuation
        return True
    
    return False


def contains_temporal_marker(text: str) -> bool:
    """
    Verify text contains actual temporal content (dates, statistics, time references).
    Returns True if specific temporal markers are found.
    """
    if not text:
        return False
    
    temporal_patterns = [
        r'\b\d{4}\b',  # Year (2023, 2024)
        r'\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b',  # Full date
        r'\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?\s+\d{1,2},?\s+\d{4}\b',  # Abbreviated date
        r'\b\d{1,2}/\d{1,2}/\d{2,4}\b',  # Numeric date (MM/DD/YYYY)
        r'\b\d+\.?\d*%\b',  # Percentage (statistic)
        r'\b\d+\s+(months?|years?|days?|weeks?)\s+ago\b',  # Relative time
        r'\b(Q[1-4]|quarter)\s+\d{4}\b',  # Quarter reference
        r'\b(as of|since|from|until|through)\s+\d{4}\b',  # Temporal prepositions with years
        r'\b(early|mid|late)\s+\d{4}\b',  # Temporal qualifiers with years
    ]
    
    for pattern in temporal_patterns:
        if re.search(pattern, text, re.IGNORECASE):
            return True
    
    return False


def has_structured_evidence(reasoning: str) -> bool:
    """
    Verify reasoning includes structured evidence with specific dates and calculations.
    Returns True if reasoning contains required evidence elements.
    """
    if not reasoning:
        return False
    
    required_elements = [
        r'Found Date:',
        r'Current Date:',
        r'Age:',
        r'Threshold:'
    ]
    
    # Count how many required elements are present
    matches = sum(1 for elem in required_elements if re.search(elem, reasoning, re.IGNORECASE))
    
    # Require at least 3 of 4 elements for structured evidence
    return matches >= 3


def extract_confidence_from_reasoning(reasoning: str) -> float:
    """
    Extract confidence score from reasoning text.
    Returns confidence score between 0.0 and 1.0, or 0.5 as default.
    """
    if not reasoning:
        return 0.5
    
    # Look for explicit confidence mentions
    confidence_patterns = [
        r'confidence[:\s]+(\d+)%',
        r'(\d+)%\s+confident',
        r'confidence[:\s]+(\d+\.\d+)',
    ]
    
    for pattern in confidence_patterns:
        match = re.search(pattern, reasoning, re.IGNORECASE)
        if match:
            value = float(match.group(1))
            # Convert percentage to decimal if needed
            if value > 1.0:
                value = value / 100.0
            return min(max(value, 0.0), 1.0)  # Clamp between 0 and 1
    
    # Assess confidence based on language used
    high_confidence_phrases = ['explicit date', 'clearly states', 'specifically mentions', 'found date:']
    medium_confidence_phrases = ['inferred', 'appears to', 'suggests', 'likely']
    low_confidence_phrases = ['possibly', 'may be', 'might be', 'unclear', 'ambiguous']
    
    reasoning_lower = reasoning.lower()
    
    if any(phrase in reasoning_lower for phrase in high_confidence_phrases):
        return 0.9
    elif any(phrase in reasoning_lower for phrase in low_confidence_phrases):
        return 0.4
    elif any(phrase in reasoning_lower for phrase in medium_confidence_phrases):
        return 0.6
    
    # Default medium confidence if no indicators found
    return 0.5



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

CRITICAL VALIDATION REQUIREMENTS:

1. SPECIFIC CONTENT ONLY:
   - flaggedText MUST contain actual temporal content (dates, statistics, numbers)
   - flaggedText MUST NOT be just a section heading or title
   - Example VALID: "According to 2023 data, interest rates were 6.5%"
   - Example INVALID: "Home-Buying Loan Types" (heading only, no temporal content)

2. EVIDENCE-BASED REASONING REQUIRED:
   - Use structured format: "Found Date: [X], Current Date: [Y], Age: [Z], Threshold: [T], Verdict: [STALE/CURRENT]"
   - Show exact calculation of age
   - Cite specific text containing the date
   - NO hedge language ("likely", "possibly", "may be", "appears to")
   - Use definitive language: "Found date: X" not "likely refers to X"

3. CONFIDENCE ASSESSMENT:
   - Assign confidence level in reasoning: HIGH (explicit date found), MEDIUM (inferred from context), LOW (assumed)
   - Include confidence percentage if possible (e.g., "Confidence: 90%")
   - Specify evidence type: EXPLICIT_DATE, INFERRED_DATE, or STATISTICAL_REFERENCE

4. REJECTION CRITERIA - DO NOT FLAG IF:
   - You cannot find a SPECIFIC date, statistic, or temporal reference
   - The flaggedText would be just a heading or section title
   - Your confidence is below 70%
   - Your reasoning cannot include structured evidence with specific dates
   - The content is descriptive/categorical rather than temporal (e.g., "Types of Loans" is a category, not dated content)

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
   - Interpret these rules carefully, distinguishing between ABSOLUTE YEAR BOUNDARIES and RELATIVE TIME PERIODS:
   
   **ABSOLUTE YEAR BOUNDARY RULES** (e.g., "Anything older than 2025", "Nothing before 2024"):
     * "Anything older than 2025" means: Flag ANY content from years BEFORE 2025 (2024, 2023, etc.)
     * "Anything older than 2025" does NOT mean: Flag content from earlier months within 2025
     * Example: If rule is "Anything older than 2025" and current date is December 31, 2025:
       - January 2025 data = CURRENT ✓
       - June 2025 data = CURRENT ✓
       - December 2024 data = STALE ✗
       - Any 2023 or earlier = STALE ✗
   
   **RELATIVE TIME PERIOD RULES** (e.g., "older than 6 months", "older than 2 years"):
     * "older than 6 months" means content dated before approximately 6 months ago from {current_date}
     * "older than 2 years" means content dated before approximately 2 years ago from {current_date}
     * Calculate the threshold date and flag content before that date
   
   **OTHER RULES**:
     * "immediate" or "current only" means any past date should be flagged
     * "pre-2024 data" means content referencing years before 2024
   
   - **FUTURE DATES**: Any date in the future relative to {current_date} is CURRENT. DO NOT FLAG.
   - **RECENT DATES**: Apply the user's rules to determine if content is recent enough.
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
            
            # Add unique IDs to issues with enhanced validation
            issues = []
            for issue in issues_data:
                flagged_text = issue.get("flaggedText", "")
                reasoning = issue.get("reasoning", "")
                description = issue.get("description", "")
                
                # Validate: Check if reasoning contradicts the flag
                reasoning_lower = reasoning.lower()
                contradictory_phrases = [
                    "should not be flagged",
                    "should not flag",
                    "is valid for",
                    "is current",
                    "not stale",
                    "do not flag",
                    "don't flag"
                ]
                
                if any(phrase in reasoning_lower for phrase in contradictory_phrases):
                    print(f"[VALIDATION] Rejected - Contradictory reasoning: {description}")
                    print(f"[VALIDATION] Reasoning: {reasoning}")
                    continue
                
                # NEW VALIDATION 1: Reject if flaggedText is just a heading
                if is_heading_only(flagged_text):
                    print(f"[VALIDATION] Rejected - flaggedText is heading only: '{flagged_text}'")
                    print(f"[VALIDATION] Issue description: {description}")
                    continue
                
                # NEW VALIDATION 2: Require specific temporal markers in flaggedText
                if not contains_temporal_marker(flagged_text):
                    print(f"[VALIDATION] Rejected - No temporal marker in flaggedText: '{flagged_text}'")
                    print(f"[VALIDATION] Issue description: {description}")
                    continue
                
                # NEW VALIDATION 3: Require structured evidence in reasoning
                if not has_structured_evidence(reasoning):
                    print(f"[VALIDATION] Rejected - Reasoning lacks structured evidence")
                    print(f"[VALIDATION] Reasoning: {reasoning[:200]}...")
                    continue
                
                # NEW VALIDATION 4: Check confidence level
                confidence_score = extract_confidence_from_reasoning(reasoning)
                if confidence_score < 0.7:
                    print(f"[VALIDATION] Rejected - Low confidence: {confidence_score:.2f}")
                    print(f"[VALIDATION] Issue description: {description}")
                    continue
                
                # All validations passed - add issue with confidence metadata
                print(f"[VALIDATION] ✓ Accepted issue: {description}")
                print(f"[VALIDATION] Confidence: {confidence_score:.2f}")
                print(f"[VALIDATION] Flagged text: {flagged_text[:100]}...")
                
                issues.append({
                    "id": f"issue_{uuid.uuid4().hex[:8]}",
                    "description": description,
                    "flaggedText": flagged_text,
                    "contextExcerpt": issue.get("contextExcerpt", ""),
                    "reasoning": reasoning,
                    "confidence": confidence_score,
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