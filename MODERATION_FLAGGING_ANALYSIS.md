# Moderation Flagging Mechanism Analysis
## Case Study: "Home-Buying Loan Types" False Positive

### Executive Summary

The moderation system flagged a section titled "Home-Buying Loan Types" as containing stale statistics without identifying the specific outdated data point. This analysis examines the decision-making failure, root causes, and proposes concrete code improvements to enforce transparency and specificity.

---

## 1. The Flagging Incident

**What Was Flagged:**
- Section title: "Home-Buying Loan Types"
- Classification: "Stale statistic or data point"
- Reasoning: "The section titled 'Home-Buying Loan Types' is likely outdated, as it refers to information from before the current year of 2025 specified in the analysis parameters."

**Critical Missing Information:**
- ❌ No specific date cited
- ❌ No specific statistic identified
- ❌ No sentence-level location provided
- ❌ No actual outdated text quoted
- ❌ Hedge language used ("is likely outdated")

---

## 2. System Architecture Analysis

### Current 4-Step Evaluation Process

From [`detector.py:37-76`](backend/services/detector.py:37-76):

```
STEP 1 - IDENTIFY: Locate all date references (absolute or relative)
STEP 2 - RESOLVE CONTEXT: Scan surrounding text for applicable years
STEP 3 - CALCULATE AGE: Determine precise age relative to current date
STEP 4 - APPLY RULES: Check against user's staleness threshold
```

### Where the Process Failed

**STEP 2 (RESOLVE CONTEXT) Failure:**

The system's context resolution logic (lines 41-45) states:
```
- If a month/day appears WITHOUT a year, scan surrounding text
- Look for patterns like "November 21, 2025" or "Published: 2025"
- If title contains current_year or future year, assume that applies
- DO NOT assume isolated month name refers to past occurrence
```

**Failure Scenario:**
1. System found ambiguous temporal language in the section
2. Failed to locate contextual year information in headers/metadata
3. Incorrectly inferred content was from pre-2025
4. Flagged entire section title instead of specific content

---

## 3. Root Cause: Insufficient Specificity Enforcement

### Current Requirements (Lines 93-101)

The prompt requests four fields:
```json
{
  "description": "Clear description of what is stale",
  "flaggedText": "The exact quote from the content that is outdated",
  "contextExcerpt": "Three-sentence excerpt with **bold markdown**",
  "reasoning": "Explanation of why this is considered stale"
}
```

### The Problem

**No enforcement mechanism ensures:**
- `flaggedText` contains actual temporal content (dates, statistics, numbers)
- `flaggedText` is NOT just a section heading
- `reasoning` includes specific evidence (found date, calculated age)
- Confidence level is assessed before flagging

### Validation Gap (Lines 148-161)

Current validation only checks for contradictory phrases:
```python
contradictory_phrases = [
    "should not be flagged",
    "is current",
    "not stale"
]
```

**Missing validations:**
- No check if `flaggedText` is a heading vs. actual content
- No verification that specific date/statistic was found
- No confidence threshold requirement
- No enforcement of evidence-based reasoning format

---

## 4. False Positive Analysis

### Evidence This Is a False Positive

**A. Descriptive vs. Temporal Title**
- "Home-Buying Loan Types" is a **categorical descriptor**
- Contains no inherent temporal information
- Similar to "Types of Mortgages" or "Loan Categories"
- Not a date-stamped title like "2023 Loan Types Report"

**B. Inference-Based Rather Than Evidence-Based**
- Reasoning uses "is likely outdated" (probabilistic language)
- States "refers to information from before 2025" without citation
- No specific date extracted from content
- No calculation shown (e.g., "Found: Nov 2023, Age: 26 months")

**C. Context Resolution Failure Indicators**

The system likely encountered:
1. **Ambiguous month reference**: Found "November" without year
2. **Missing metadata**: No publication date in headers
3. **Default assumption**: Assumed past year when context unclear
4. **Title misinterpretation**: Treated section heading as temporal marker

**D. Staleness Rules Misapplication**

If user's rule was "Anything older than 2025":
- This means flag content from **years before 2025** (2024, 2023, etc.)
- Does NOT mean flag section titles about loan types
- Requires actual dated content to evaluate

---

## 5. System Architecture Weaknesses

### A. Binary Flagging Without Confidence Scoring

**Current:** Flag or don't flag (binary decision)

**Missing:**
- Confidence percentage (e.g., "85% confident this is outdated")
- Certainty levels: HIGH / MEDIUM / LOW
- Evidence strength indicators
- Distinction between "definitely outdated" vs. "possibly outdated"

### B. Inference-Based vs. Evidence-Based Approach

**Current Approach (Inference-Based):**
- Prioritizes recall (catch all potential issues)
- Accepts vague reasoning
- Allows flagging based on assumptions
- Results in false positives

**Needed Approach (Evidence-Based):**
- Prioritizes precision (only flag verified issues)
- Requires specific evidence
- Rejects assumption-based flags
- Reduces false positives

### C. Lack of Structured Reasoning Format

**Current:** Free-form text reasoning

**Needed:** Structured format:
```
Found Date: November 2023
Current Date: December 31, 2025
Age: 26 months
Threshold: 12 months (user rule: "older than 1 year")
Verdict: STALE (exceeds threshold by 14 months)
```

### D. No Date Extraction Logging

**Missing transparency:**
- Which dates were found in content
- How context was resolved for ambiguous dates
- What assumptions were made
- Why specific date was chosen over alternatives

---

## 6. Specific Code Improvements Required

### Improvement 1: Enforce Specific Data Point Citation

**Location:** [`detector.py:144-170`](backend/services/detector.py:144-170)

**Current validation:**
```python
# Only checks for contradictory phrases
if any(phrase in reasoning for phrase in contradictory_phrases):
    continue
```

**Required enhancement:**
```python
# Validate flaggedText contains actual temporal content
flagged_text = issue.get("flaggedText", "")

# Reject if flaggedText is just a heading/title
if is_heading_only(flagged_text):
    print(f"[VALIDATION] Rejected: flaggedText is heading, not specific content")
    continue

# Require specific temporal markers
if not contains_temporal_marker(flagged_text):
    print(f"[VALIDATION] Rejected: No date/statistic in flaggedText")
    continue

# Require evidence-based reasoning
if not has_structured_evidence(issue.get("reasoning", "")):
    print(f"[VALIDATION] Rejected: Reasoning lacks specific evidence")
    continue
```

### Improvement 2: Add Confidence Scoring

**Location:** [`detector.py:93-101`](backend/services/detector.py:93-101)

**Add to required fields:**
```json
{
  "description": "...",
  "flaggedText": "...",
  "contextExcerpt": "...",
  "reasoning": "...",
  "confidence": "HIGH|MEDIUM|LOW",
  "confidenceScore": 0.85,
  "evidenceType": "EXPLICIT_DATE|INFERRED_DATE|STATISTICAL_REFERENCE"
}
```

**Validation logic:**
```python
# Reject low-confidence flags
confidence_score = issue.get("confidenceScore", 0)
if confidence_score < 0.7:
    print(f"[VALIDATION] Rejected: Confidence {confidence_score} below threshold")
    continue
```

### Improvement 3: Structured Reasoning Format

**Location:** [`detector.py:31-106`](backend/services/detector.py:31-106)

**Update prompt to require:**
```
"reasoning": "STRUCTURED FORMAT REQUIRED:
  Found Date: [exact date found in content]
  Current Date: {current_date}
  Age: [calculated age in months/years]
  Threshold: [user's staleness rule]
  Verdict: [STALE/CURRENT] ([explanation])
  Evidence: [quote showing the date]"
```

### Improvement 4: Date Extraction Logging

**Location:** [`detector.py:93-101`](backend/services/detector.py:93-101)

**Add to required fields:**
```json
{
  "dateExtraction": {
    "datesFound": ["November 2023", "2023"],
    "contextUsed": "Publication date in header",
    "resolutionMethod": "EXPLICIT|INFERRED_FROM_CONTEXT|ASSUMED",
    "assumptions": ["Assumed November refers to 2023 based on header"]
  }
}
```

### Improvement 5: Heading Detection Function

**Location:** New utility function

```python
def is_heading_only(text: str) -> bool:
    """
    Detect if text is just a heading/title without specific content
    """
    # Check for heading patterns
    heading_patterns = [
        r'^[A-Z][a-zA-Z\s-]+$',  # Title Case Without Punctuation
        r'^#+\s+',  # Markdown heading
        r'^[A-Z\s]+$',  # ALL CAPS
    ]
    
    # Check length (headings are typically short)
    if len(text.split()) <= 6:
        for pattern in heading_patterns:
            if re.match(pattern, text):
                return True
    
    return False

def contains_temporal_marker(text: str) -> bool:
    """
    Verify text contains actual temporal content
    """
    temporal_patterns = [
        r'\b\d{4}\b',  # Year (2023, 2024)
        r'\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b',  # Full date
        r'\b\d{1,2}%\b',  # Percentage (statistic)
        r'\b\d+\s+(months?|years?|days?)\s+ago\b',  # Relative time
        r'\b(Q[1-4]|quarter)\s+\d{4}\b',  # Quarter reference
    ]
    
    for pattern in temporal_patterns:
        if re.search(pattern, text, re.IGNORECASE):
            return True
    
    return False

def has_structured_evidence(reasoning: str) -> bool:
    """
    Verify reasoning includes structured evidence
    """
    required_elements = [
        r'Found Date:',
        r'Current Date:',
        r'Age:',
        r'Threshold:'
    ]
    
    matches = sum(1 for elem in required_elements if re.search(elem, reasoning))
    return matches >= 3  # Require at least 3 of 4 elements
```

### Improvement 6: Enhanced Prompt Instructions

**Location:** [`detector.py:31-106`](backend/services/detector.py:31-106)

**Add to prompt:**
```
CRITICAL VALIDATION REQUIREMENTS:

1. SPECIFIC CONTENT ONLY:
   - flaggedText MUST contain actual temporal content (dates, statistics, numbers)
   - flaggedText MUST NOT be just a section heading or title
   - Example VALID: "According to 2023 data, interest rates were 6.5%"
   - Example INVALID: "Home-Buying Loan Types" (heading only)

2. EVIDENCE-BASED REASONING:
   - Use structured format: Found Date: X, Current Date: Y, Age: Z, Threshold: T
   - Show exact calculation of age
   - Cite specific text containing the date
   - NO hedge language ("likely", "possibly", "may be")

3. CONFIDENCE ASSESSMENT:
   - Assign confidence: HIGH (explicit date found), MEDIUM (inferred from context), LOW (assumed)
   - Include confidenceScore: 0.0-1.0
   - Specify evidenceType: EXPLICIT_DATE, INFERRED_DATE, or STATISTICAL_REFERENCE

4. DATE EXTRACTION TRANSPARENCY:
   - List all dates found in content
   - Explain how context was resolved for ambiguous dates
   - Document any assumptions made
   - Show resolution method used

5. REJECTION CRITERIA:
   - If you cannot find a SPECIFIC date, statistic, or temporal reference, DO NOT flag
   - If flaggedText would be just a heading, DO NOT flag
   - If confidence is below 70%, DO NOT flag
   - If reasoning cannot be structured with evidence, DO NOT flag
```

---

## 7. Implementation Priority

### Phase 1: Immediate Fixes (High Priority)
1. ✅ Add `is_heading_only()` validation
2. ✅ Add `contains_temporal_marker()` validation
3. ✅ Reject flags without specific temporal content
4. ✅ Update prompt with strict validation requirements

### Phase 2: Enhanced Transparency (Medium Priority)
5. ✅ Add confidence scoring fields
6. ✅ Implement structured reasoning format
7. ✅ Add `has_structured_evidence()` validation
8. ✅ Require minimum confidence threshold

### Phase 3: Advanced Features (Lower Priority)
9. ⏳ Add date extraction logging
10. ⏳ Implement resolution method tracking
11. ⏳ Create assumption documentation
12. ⏳ Build confidence calibration system

---

## 8. Expected Outcomes

### Before Improvements
- ❌ Vague flags: "Section is likely outdated"
- ❌ No specific data point cited
- ❌ Hedge language accepted
- ❌ Headings flagged as content
- ❌ No confidence assessment
- ❌ High false positive rate

### After Improvements
- ✅ Specific flags: "Found date: Nov 2023, Age: 26 months, exceeds 12-month threshold"
- ✅ Exact temporal content quoted
- ✅ Evidence-based reasoning required
- ✅ Headings rejected automatically
- ✅ Confidence scores provided
- ✅ Reduced false positives

---

## 9. Testing Strategy

### Test Case 1: Heading-Only Flag (Should Reject)
```
Input: flaggedText = "Home-Buying Loan Types"
Expected: REJECTED (heading only, no temporal content)
```

### Test Case 2: Specific Date Flag (Should Accept)
```
Input: flaggedText = "According to November 2023 data, rates were 6.5%"
Expected: ACCEPTED (contains specific date and statistic)
```

### Test Case 3: Vague Reasoning (Should Reject)
```
Input: reasoning = "This section is likely outdated"
Expected: REJECTED (no structured evidence)
```

### Test Case 4: Structured Reasoning (Should Accept)
```
Input: reasoning = "Found Date: Nov 2023, Current: Dec 2025, Age: 26 months, Threshold: 12 months, STALE"
Expected: ACCEPTED (structured evidence provided)
```

### Test Case 5: Low Confidence (Should Reject)
```
Input: confidenceScore = 0.45
Expected: REJECTED (below 0.7 threshold)
```

---

## 10. Conclusion

The "Home-Buying Loan Types" false positive resulted from:

1. **Context resolution failure** in Step 2 of the evaluation process
2. **Insufficient specificity enforcement** allowing heading-only flags
3. **Lack of confidence scoring** to filter uncertain flags
4. **Inference-based approach** prioritizing recall over precision
5. **Missing validation** for temporal content in flaggedText
6. **Unstructured reasoning** without evidence requirements

The proposed code improvements enforce:
- Specific data point citation (not headings)
- Evidence-based reasoning with structured format
- Confidence scoring and thresholds
- Temporal content validation
- Date extraction transparency
- Rejection of vague or assumption-based flags

These changes will transform the system from inference-based to evidence-based, dramatically reducing false positives while maintaining the ability to catch genuine staleness issues.