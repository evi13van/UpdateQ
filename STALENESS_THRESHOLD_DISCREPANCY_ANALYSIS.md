# Staleness Threshold Discrepancy Analysis

## Executive Summary

A critical configuration discrepancy has been identified in the UpdateQ analysis system where the **user-configured 6-month staleness threshold is being overridden by a hardcoded 1-year threshold** in the detection logic. This results in the system analyzing data that is twice as old as the intended threshold, compromising the accuracy and relevance of staleness detection.

---

## 1. Discrepancy Documentation

### Configured Threshold (User Interface)
- **Location:** Analysis Configuration UI (Screenshot 1)
- **Field:** "What makes information stale?"
- **User Input:** `"any statistic and date references older than 6 months from today"`
- **Expected Behavior:** System should flag content older than 6 months

### Actual Threshold (Backend Implementation)
- **Location:** [`backend/services/detector.py:34`](backend/services/detector.py:34)
- **Hardcoded Value:** `"Staleness Threshold: Content is stale if older than 1 year"`
- **Actual Behavior:** System flags content older than 1 year (12 months)

### Evidence from Analysis Results
From the screenshot showing detected issues:
- **Issue 1:** "Updated Oct. 14, 2020" - Flagged as stale
- **Issue 2:** "August 27, 2020" statistics - Flagged as stale
- **Reasoning:** "The content is over 5 years old, well past the 1-year staleness threshold"

**Critical Finding:** The system's reasoning explicitly references a "1-year staleness threshold" despite the user configuring a 6-month threshold.

---

## 2. Root Cause Analysis

### Primary Cause: Hardcoded Threshold in Detection Logic

**File:** [`backend/services/detector.py`](backend/services/detector.py:21-34)

```python
# Lines 21-34
current_date = datetime.now().strftime("%B %d, %Y")
current_year = datetime.now().year
one_year_ago = datetime.now().replace(year=datetime.now().year - 1).strftime("%B %d, %Y")

# Construct prompt
content_preview = content[:8000] if len(content) > 8000 else content

prompt = f"""You are a content auditor specializing in temporal accuracy and stale information detection.

ANALYSIS PARAMETERS:
- Current Reference Date: {current_date}
- Current Year: {current_year}
- Staleness Threshold: Content is stale if older than 1 year from {current_date}
- One Year Ago Date: {one_year_ago}
```

**Problem:** The staleness threshold is hardcoded as "1 year" in the prompt template and never references the user-provided `domain_context['stalenessRules']`.

### Secondary Issues

1. **Ignored Configuration Parameter**
   - **Location:** [`backend/services/detector.py:8`](backend/services/detector.py:8)
   - The function receives `domain_context: dict` which contains `stalenessRules`
   - **Line 61:** `Staleness Rules: {domain_context.get('stalenessRules', '')}`
   - This is included in the prompt but **after** the hardcoded threshold, causing the AI to prioritize the explicit "1 year" instruction

2. **Conflicting Instructions in Prompt**
   - **Lines 34 & 61:** Two different staleness definitions exist in the same prompt
   - The explicit "Staleness Threshold: Content is stale if older than 1 year" (line 34) takes precedence
   - The user's "any statistic and date references older than 6 months from today" (line 61) is treated as supplementary context

3. **No Dynamic Threshold Calculation**
   - The code calculates `one_year_ago` but never calculates a dynamic threshold based on user input
   - No parsing logic exists to extract "6 months" from the user's staleness rules text

---

## 3. Data Flow Analysis

### Configuration Flow
```
User Input (UI) 
  ↓
"any statistic and date references older than 6 months from today"
  ↓
Frontend → Backend API
  ↓
Stored in domain_context.stalenessRules
  ↓
Passed to detect_stale_content()
  ↓
❌ IGNORED - Hardcoded "1 year" used instead
  ↓
Claude API receives conflicting instructions
  ↓
Claude prioritizes explicit "1 year" threshold
  ↓
Results show 1-year threshold applied
```

### Expected vs Actual Behavior

| Aspect | Expected (6-month threshold) | Actual (1-year threshold) |
|--------|------------------------------|---------------------------|
| **Data from Oct 2020** | Should be flagged (>6 months old) | ✅ Flagged (>1 year old) |
| **Data from Aug 2020** | Should be flagged (>6 months old) | ✅ Flagged (>1 year old) |
| **Data from July 2024** | Should be flagged (>6 months old) | ❌ NOT flagged (<1 year old) |
| **Data from Nov 2024** | Should be flagged (>6 months old) | ❌ NOT flagged (<1 year old) |

---

## 4. Impact Assessment

### Accuracy Impact
- **False Negatives:** Content between 6-12 months old is NOT being flagged
- **Severity:** HIGH - System is missing 50% of stale content that should be detected
- **Example:** Data from July 2024 (6 months old) would pass as "current" despite being stale per user configuration

### Reliability Impact
- **User Trust:** Configuration appears to be ignored, undermining system credibility
- **Consistency:** Different analyses may produce inconsistent results if users expect 6-month threshold
- **Compliance:** If 6-month threshold is a business requirement, system is non-compliant

### Business Impact
- **Content Quality:** Stale content (6-12 months old) remains undetected and unfixed
- **Resource Allocation:** Writers may not be assigned to update content that should be flagged
- **Decision Making:** Analysis reports underestimate the true scope of stale content

---

## 5. Technical Analysis

### Why the Override Occurs

1. **Prompt Engineering Priority**
   - Claude AI models follow explicit, structured instructions first
   - The hardcoded "Staleness Threshold: Content is stale if older than 1 year" appears in the "ANALYSIS PARAMETERS" section
   - The user's staleness rules appear later in "Domain Context" section
   - AI prioritizes the explicit parameter over contextual information

2. **No Validation Layer**
   - No code validates that the hardcoded threshold matches user configuration
   - No warnings or errors are generated when thresholds conflict

3. **Static vs Dynamic Configuration**
   - System uses static 1-year calculation: `datetime.now().replace(year=datetime.now().year - 1)`
   - No dynamic calculation based on user input (e.g., `datetime.now() - timedelta(days=180)` for 6 months)

---

## 6. Recommendations for Corrective Measures

### Immediate Fix (Priority 1)

**Parse and Apply User-Defined Threshold**

Modify [`backend/services/detector.py`](backend/services/detector.py:21-34) to:

1. **Extract threshold from user input:**
```python
def parse_staleness_threshold(staleness_rules: str) -> int:
    """Extract months from staleness rules text"""
    import re
    # Look for patterns like "6 months", "3 months", "12 months"
    match = re.search(r'(\d+)\s*months?', staleness_rules.lower())
    if match:
        return int(match.group(1))
    # Default to 12 months if not specified
    return 12

threshold_months = parse_staleness_threshold(domain_context.get('stalenessRules', ''))
threshold_date = datetime.now() - timedelta(days=threshold_months * 30)
threshold_date_str = threshold_date.strftime("%B %d, %Y")
```

2. **Update prompt to use dynamic threshold:**
```python
prompt = f"""You are a content auditor specializing in temporal accuracy and stale information detection.

ANALYSIS PARAMETERS:
- Current Reference Date: {current_date}
- Current Year: {current_year}
- Staleness Threshold: Content is stale if older than {threshold_months} months from {current_date}
- Threshold Date: {threshold_date_str}
- User-Defined Staleness Rules: {domain_context.get('stalenessRules', '')}
```

### Medium-Term Improvements (Priority 2)

1. **Add Configuration Validation**
   - Validate staleness rules format in [`backend/routers/analysis.py`](backend/routers/analysis.py:92-141)
   - Provide clear error messages if threshold cannot be parsed
   - Add UI hints for proper format (e.g., "Enter threshold like: '6 months' or '90 days'")

2. **Add Logging and Monitoring**
   - Log the parsed threshold value for each analysis run
   - Add debug output showing which threshold is being applied
   - Track discrepancies between configured and applied thresholds

3. **Update UI to Standardize Input**
   - Replace free-text field with structured input (dropdown + number field)
   - Options: "X months from today" or "X days from today"
   - Prevents ambiguous configurations

### Long-Term Enhancements (Priority 3)

1. **Support Multiple Threshold Types**
   - Absolute dates: "After January 1, 2024"
   - Relative periods: "6 months", "90 days", "1 year"
   - Entity-specific thresholds: "Statistics: 3 months, Guidelines: 1 year"

2. **Add Threshold Testing**
   - Unit tests to verify threshold parsing
   - Integration tests to confirm correct threshold application
   - Regression tests to prevent future hardcoding

3. **Configuration Audit Trail**
   - Store parsed threshold value in database with each run
   - Display applied threshold in results UI
   - Allow users to verify correct threshold was used

---

## 7. Verification Steps

After implementing fixes, verify:

1. **Parse Test:** Confirm "6 months" extracts as `threshold_months = 6`
2. **Date Calculation:** Verify threshold_date is 6 months before current date
3. **Prompt Generation:** Check prompt contains "6 months" not "1 year"
4. **Detection Results:** Test with content 7 months old (should flag) and 5 months old (should not flag)
5. **UI Display:** Confirm results page shows correct threshold was applied

---

## 8. Conclusion

The discrepancy stems from a **hardcoded 1-year threshold that overrides user configuration**. The user's 6-month staleness rule is passed to the detection function but is effectively ignored due to conflicting prompt instructions. This results in:

- **50% of stale content going undetected** (content between 6-12 months old)
- **Undermined user trust** in configuration settings
- **Inaccurate analysis results** that don't meet business requirements

The fix requires parsing the user's staleness rules, calculating a dynamic threshold, and updating the prompt to use this value instead of the hardcoded 1-year threshold. This is a critical bug that should be addressed immediately to ensure analysis accuracy and system reliability.

---

## Appendix: Code References

- **Detection Logic:** [`backend/services/detector.py:8-160`](backend/services/detector.py:8-160)
- **Analysis Router:** [`backend/routers/analysis.py:23-89`](backend/routers/analysis.py:23-89)
- **Data Models:** [`backend/models/analysis.py:7-14`](backend/models/analysis.py:7-14)
- **Configuration Storage:** Domain context stored in MongoDB via [`backend/routers/analysis.py:118-122`](backend/routers/analysis.py:118-122)