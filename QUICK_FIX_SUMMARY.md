# Quick Fix: Staleness Threshold Implementation

## What Was Fixed

The minimal fix addresses the core issue where the hardcoded 1-year staleness threshold was overriding the user's configured 6-month threshold.

## Changes Made

**File:** [`backend/services/detector.py`](backend/services/detector.py)

### 1. Added Helper Function (Lines 8-21)
```python
def parse_staleness_threshold(staleness_rules: str) -> int:
    """
    Extract months from staleness rules text.
    Returns number of months, defaults to 12 if not found.
    """
    if not staleness_rules:
        return 12
    
    # Look for patterns like "6 months", "3 months", "12 months"
    match = re.search(r'(\d+)\s*months?', staleness_rules.lower())
    if match:
        return int(match.group(1))
    
    # Default to 12 months if not specified
    return 12
```

**Purpose:** Extracts the number of months from user input like "any statistic and date references older than 6 months from today"

### 2. Updated Detection Logic (Lines 35-40)
```python
# Parse staleness threshold from user configuration
staleness_rules = domain_context.get('stalenessRules', '')
threshold_months = parse_staleness_threshold(staleness_rules)
print(f"[DEBUG] Parsed staleness threshold: {threshold_months} months")

current_date = datetime.now().strftime("%B %d, %Y")
current_year = datetime.now().year
threshold_date = datetime.now() - timedelta(days=threshold_months * 30)
threshold_date_str = threshold_date.strftime("%B %d, %Y")
```

**Changes:**
- Parses user's staleness rules to extract threshold in months
- Calculates dynamic threshold date based on parsed value
- Adds debug logging to show parsed threshold

### 3. Updated Prompt Template (Lines 44-46)
```python
ANALYSIS PARAMETERS:
- Current Reference Date: {current_date}
- Current Year: {current_year}
- Staleness Threshold: Content is stale if older than {threshold_months} months from {current_date}
- Threshold Date: {threshold_date_str} (content older than this date is stale)
```

**Changes:**
- Replaced hardcoded "1 year" with dynamic `{threshold_months} months`
- Added explicit threshold date for clarity
- Removed confusing "One Year Ago Date" parameter

### 4. Updated Staleness Rules (Lines 54-56)
```python
STEP 4 - APPLY STALENESS RULES:
   - **FUTURE DATES**: Any date in the future relative to {current_date} is CURRENT. DO NOT FLAG.
   - **RECENT DATES**: Any date within {threshold_months} months of {current_date} (after {threshold_date_str}) is CURRENT. DO NOT FLAG.
   - **STALE DATES**: Only flag if the date is definitively OLDER than {threshold_date_str}.
```

**Changes:**
- Replaced "1 year" references with dynamic threshold
- Simplified rules to focus on the actual threshold date

### 5. Updated Critical Rules (Lines 68-72)
```python
CRITICAL RULES:
- If you see "November" and the year is {current_year} or later, that is NEW content. DO NOT FLAG IT.
- Only flag dates that are demonstrably older than {threshold_date_str} ({threshold_months} months ago).
- Do NOT flag valid historical references that are clearly historical (e.g., "Founded in 2020" in a company history section).
- When in doubt about a date's year, look for contextual clues in titles, headers, and surrounding text before making assumptions.
- The user has specified: "{staleness_rules}" - respect this threshold strictly.
```

**Changes:**
- Removed hardcoded year calculations
- Added explicit reference to user's staleness rules
- Emphasized strict adherence to configured threshold

## How It Works

1. **User configures:** "any statistic and date references older than 6 months from today"
2. **System parses:** Extracts "6" from the text using regex
3. **System calculates:** `threshold_date = current_date - (6 * 30 days) = ~6 months ago`
4. **Claude receives:** "Content is stale if older than 6 months" with explicit threshold date
5. **Result:** Content older than 6 months is now correctly flagged

## Testing the Fix

### Before Fix
- User config: "6 months"
- System applied: 1 year threshold
- Data from July 2024: ❌ NOT flagged (incorrectly passed as current)

### After Fix
- User config: "6 months"
- System applies: 6 months threshold
- Data from July 2024: ✅ FLAGGED (correctly identified as stale)

## Verification Steps

1. Run a new analysis with "6 months" staleness rule
2. Check backend logs for: `[DEBUG] Parsed staleness threshold: 6 months`
3. Verify content 7+ months old is flagged
4. Verify content <6 months old is NOT flagged

## Limitations

- Only parses "X months" format (e.g., "6 months", "12 months")
- Approximates months as 30 days (not exact calendar months)
- Defaults to 12 months if pattern not found

## Future Enhancements

For more robust parsing, consider:
- Supporting "X days" format
- Supporting "X years" format
- Exact calendar month calculations
- UI validation to ensure proper format