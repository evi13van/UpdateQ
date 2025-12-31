"""
Test suite for moderation flagging validation improvements.
Tests the new validation functions to ensure they correctly reject false positives.
"""

import sys
sys.path.append('.')

from services.detector import (
    is_heading_only,
    contains_temporal_marker,
    has_structured_evidence,
    extract_confidence_from_reasoning
)


def test_is_heading_only():
    """Test heading detection function"""
    print("\n=== Testing is_heading_only() ===")
    
    test_cases = [
        # Should be detected as headings (True)
        ("Home-Buying Loan Types", True, "Section title"),
        ("Types of Mortgages", True, "Category heading"),
        ("LOAN CATEGORIES", True, "All caps heading"),
        ("Introduction", True, "Single word heading"),
        ("Getting Started With Loans", True, "Title case heading"),
        
        # Should NOT be detected as headings (False)
        ("According to 2023 data, interest rates were 6.5%", False, "Sentence with date"),
        ("The report from November 2023 shows declining rates.", False, "Full sentence"),
        ("In Q4 2024, mortgage applications increased by 15%.", False, "Sentence with statistics"),
        ("This section covers loan types available as of 2025.", False, "Sentence with temporal marker"),
    ]
    
    passed = 0
    failed = 0
    
    for text, expected, description in test_cases:
        result = is_heading_only(text)
        status = "✓ PASS" if result == expected else "✗ FAIL"
        if result == expected:
            passed += 1
        else:
            failed += 1
        print(f"{status}: '{text}' -> {result} (expected {expected}) - {description}")
    
    print(f"\nResults: {passed} passed, {failed} failed")
    return failed == 0


def test_contains_temporal_marker():
    """Test temporal marker detection function"""
    print("\n=== Testing contains_temporal_marker() ===")
    
    test_cases = [
        # Should contain temporal markers (True)
        ("According to 2023 data, rates were high", True, "Contains year"),
        ("Published on November 21, 2024", True, "Full date"),
        ("Interest rates were 6.5% in Q4 2023", True, "Year and percentage"),
        ("Data from 3 months ago shows improvement", True, "Relative time"),
        ("As of 2024, the policy changed", True, "Temporal preposition"),
        ("The report dated 12/15/2023 indicates", True, "Numeric date"),
        
        # Should NOT contain temporal markers (False)
        ("Home-Buying Loan Types", False, "Section title only"),
        ("Types of Mortgages Available", False, "Category description"),
        ("Introduction to Lending", False, "Generic heading"),
        ("Overview of Financial Products", False, "Descriptive title"),
    ]
    
    passed = 0
    failed = 0
    
    for text, expected, description in test_cases:
        result = contains_temporal_marker(text)
        status = "✓ PASS" if result == expected else "✗ FAIL"
        if result == expected:
            passed += 1
        else:
            failed += 1
        print(f"{status}: '{text}' -> {result} (expected {expected}) - {description}")
    
    print(f"\nResults: {passed} passed, {failed} failed")
    return failed == 0


def test_has_structured_evidence():
    """Test structured evidence detection function"""
    print("\n=== Testing has_structured_evidence() ===")
    
    test_cases = [
        # Should have structured evidence (True)
        (
            "Found Date: November 2023, Current Date: December 2025, Age: 25 months, Threshold: 12 months, Verdict: STALE",
            True,
            "Complete structured format"
        ),
        (
            "Found Date: 2023, Current Date: 2025, Age: 2 years, exceeds threshold of 1 year",
            True,
            "Has 3 of 4 required elements"
        ),
        (
            "The content shows Found Date: Q4 2023, Current Date: 2025, Age: 2 years",
            True,
            "Embedded structured elements"
        ),
        
        # Should NOT have structured evidence (False)
        (
            "This section is likely outdated as it refers to information from before 2025",
            False,
            "Vague reasoning without structure"
        ),
        (
            "The content appears to be from a previous year",
            False,
            "Hedge language without specifics"
        ),
        (
            "May be outdated based on the title",
            False,
            "Assumption-based reasoning"
        ),
    ]
    
    passed = 0
    failed = 0
    
    for text, expected, description in test_cases:
        result = has_structured_evidence(text)
        status = "✓ PASS" if result == expected else "✗ FAIL"
        if result == expected:
            passed += 1
        else:
            failed += 1
        print(f"{status}: {result} (expected {expected}) - {description}")
        print(f"  Text: {text[:80]}...")
    
    print(f"\nResults: {passed} passed, {failed} failed")
    return failed == 0


def test_extract_confidence_from_reasoning():
    """Test confidence extraction function"""
    print("\n=== Testing extract_confidence_from_reasoning() ===")
    
    test_cases = [
        # High confidence cases
        ("Found explicit date: November 2023. Confidence: 95%", 0.95, "Explicit confidence percentage"),
        ("The text clearly states 2023 data", 0.9, "High confidence language"),
        ("Specifically mentions November 2023", 0.9, "Explicit date reference"),
        
        # Medium confidence cases
        ("The date appears to be from 2023", 0.6, "Medium confidence language"),
        ("Inferred from context that this is 2023 data", 0.6, "Inferred date"),
        ("Likely refers to 2023 based on surrounding text", 0.6, "Likely language"),
        
        # Low confidence cases
        ("This may be outdated", 0.4, "Low confidence language"),
        ("Possibly from a previous year", 0.4, "Uncertain language"),
        ("Unclear if this is current", 0.4, "Ambiguous language"),
    ]
    
    passed = 0
    failed = 0
    
    for text, expected_min, description in test_cases:
        result = extract_confidence_from_reasoning(text)
        # Allow some tolerance for confidence scores
        tolerance = 0.15
        is_correct = abs(result - expected_min) <= tolerance
        status = "✓ PASS" if is_correct else "✗ FAIL"
        if is_correct:
            passed += 1
        else:
            failed += 1
        print(f"{status}: {result:.2f} (expected ~{expected_min:.2f}) - {description}")
        print(f"  Text: {text[:80]}...")
    
    print(f"\nResults: {passed} passed, {failed} failed")
    return failed == 0


def test_false_positive_scenario():
    """Test the specific false positive case from the screenshot"""
    print("\n=== Testing False Positive Scenario ===")
    print("Scenario: 'Home-Buying Loan Types' flagged without specific data point")
    
    flagged_text = "Home-Buying Loan Types"
    reasoning = "The section titled 'Home-Buying Loan Types' is likely outdated, as it refers to information from before the current year of 2025 specified in the analysis parameters."
    
    print(f"\nFlagged Text: '{flagged_text}'")
    print(f"Reasoning: {reasoning}")
    
    # Run all validations
    is_heading = is_heading_only(flagged_text)
    has_temporal = contains_temporal_marker(flagged_text)
    has_evidence = has_structured_evidence(reasoning)
    confidence = extract_confidence_from_reasoning(reasoning)
    
    print(f"\nValidation Results:")
    print(f"  is_heading_only: {is_heading} (should be True)")
    print(f"  contains_temporal_marker: {has_temporal} (should be False)")
    print(f"  has_structured_evidence: {has_evidence} (should be False)")
    print(f"  confidence_score: {confidence:.2f} (should be < 0.7)")
    
    # This should be rejected by at least one validation
    should_reject = is_heading or not has_temporal or not has_evidence or confidence < 0.7
    
    if should_reject:
        print(f"\n✓ PASS: This false positive would be correctly REJECTED")
        print(f"  Rejection reasons:")
        if is_heading:
            print(f"    - flaggedText is heading only")
        if not has_temporal:
            print(f"    - No temporal marker in flaggedText")
        if not has_evidence:
            print(f"    - Reasoning lacks structured evidence")
        if confidence < 0.7:
            print(f"    - Confidence {confidence:.2f} below 0.7 threshold")
        return True
    else:
        print(f"\n✗ FAIL: This false positive would NOT be rejected")
        return False


def test_valid_flag_scenario():
    """Test a valid flag that should pass all validations"""
    print("\n=== Testing Valid Flag Scenario ===")
    print("Scenario: Legitimate stale content with specific date")
    
    flagged_text = "According to November 2023 data, mortgage rates averaged 7.2%"
    reasoning = "Found Date: November 2023, Current Date: December 31, 2025, Age: 25 months, Threshold: 12 months, Verdict: STALE (exceeds threshold by 13 months). Confidence: 95%"
    
    print(f"\nFlagged Text: '{flagged_text}'")
    print(f"Reasoning: {reasoning}")
    
    # Run all validations
    is_heading = is_heading_only(flagged_text)
    has_temporal = contains_temporal_marker(flagged_text)
    has_evidence = has_structured_evidence(reasoning)
    confidence = extract_confidence_from_reasoning(reasoning)
    
    print(f"\nValidation Results:")
    print(f"  is_heading_only: {is_heading} (should be False)")
    print(f"  contains_temporal_marker: {has_temporal} (should be True)")
    print(f"  has_structured_evidence: {has_evidence} (should be True)")
    print(f"  confidence_score: {confidence:.2f} (should be >= 0.7)")
    
    # This should pass all validations
    should_accept = not is_heading and has_temporal and has_evidence and confidence >= 0.7
    
    if should_accept:
        print(f"\n✓ PASS: This valid flag would be correctly ACCEPTED")
        return True
    else:
        print(f"\n✗ FAIL: This valid flag would be incorrectly REJECTED")
        print(f"  Rejection reasons:")
        if is_heading:
            print(f"    - flaggedText detected as heading (incorrect)")
        if not has_temporal:
            print(f"    - No temporal marker detected (incorrect)")
        if not has_evidence:
            print(f"    - Structured evidence not detected (incorrect)")
        if confidence < 0.7:
            print(f"    - Confidence {confidence:.2f} below threshold (incorrect)")
        return False


def run_all_tests():
    """Run all test suites"""
    print("=" * 80)
    print("MODERATION FLAGGING VALIDATION TEST SUITE")
    print("=" * 80)
    
    results = []
    
    results.append(("is_heading_only", test_is_heading_only()))
    results.append(("contains_temporal_marker", test_contains_temporal_marker()))
    results.append(("has_structured_evidence", test_has_structured_evidence()))
    results.append(("extract_confidence_from_reasoning", test_extract_confidence_from_reasoning()))
    results.append(("false_positive_scenario", test_false_positive_scenario()))
    results.append(("valid_flag_scenario", test_valid_flag_scenario()))
    
    print("\n" + "=" * 80)
    print("FINAL RESULTS")
    print("=" * 80)
    
    for test_name, passed in results:
        status = "✓ PASSED" if passed else "✗ FAILED"
        print(f"{status}: {test_name}")
    
    total_passed = sum(1 for _, passed in results if passed)
    total_tests = len(results)
    
    print(f"\nOverall: {total_passed}/{total_tests} test suites passed")
    
    if total_passed == total_tests:
        print("\n🎉 All tests passed! The validation improvements are working correctly.")
        return True
    else:
        print(f"\n⚠️  {total_tests - total_passed} test suite(s) failed. Review the output above.")
        return False


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)