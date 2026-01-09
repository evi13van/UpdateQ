#!/usr/bin/env python3
"""
Production Diagnosis Script for Stale Content Detection Failures

This script tests the validation logic with production-like scenarios to identify
why tests pass locally but fail in production.
"""

import sys
import os
sys.path.append('.')

from services.detector import (
    is_heading_only,
    contains_temporal_marker,
    has_structured_evidence,
    extract_confidence_from_reasoning
)
from datetime import datetime
import json


def test_production_scenario_1():
    """
    Test Case 1: Content that SHOULD be flagged (positive test case)
    Simulates stale content with explicit dates that should trigger detection
    """
    print("\n" + "="*80)
    print("TEST 1: Content with explicit stale dates (SHOULD FLAG)")
    print("="*80)
    
    test_cases = [
        {
            "name": "Explicit 2023 date with statistics",
            "flagged_text": "According to November 2023 data, mortgage rates averaged 7.2%",
            "reasoning": "Found Date: November 2023, Current Date: January 9, 2026, Age: 26 months, Threshold: 6 months, Verdict: STALE. Confidence: 95%",
            "should_pass": True
        },
        {
            "name": "Q4 2023 reference with percentage",
            "flagged_text": "In Q4 2023, applications increased by 15%",
            "reasoning": "Found Date: Q4 2023, Current Date: January 2026, Age: 25 months, Threshold: 6 months, Verdict: STALE. Confidence: 90%",
            "should_pass": True
        },
        {
            "name": "Specific date from 2020",
            "flagged_text": "Updated Oct. 14, 2020 - Interest rates were at historic lows",
            "reasoning": "Found Date: October 14, 2020, Current Date: January 9, 2026, Age: 63 months, Threshold: 6 months, Verdict: STALE. Confidence: 100%",
            "should_pass": True
        }
    ]
    
    results = []
    for test in test_cases:
        print(f"\n--- {test['name']} ---")
        print(f"Flagged Text: {test['flagged_text']}")
        print(f"Reasoning: {test['reasoning'][:100]}...")
        
        is_heading = is_heading_only(test['flagged_text'])
        has_temporal = contains_temporal_marker(test['flagged_text'])
        has_evidence = has_structured_evidence(test['reasoning'])
        confidence = extract_confidence_from_reasoning(test['reasoning'])
        
        passes_validation = (
            not is_heading and 
            has_temporal and 
            has_evidence and 
            confidence >= 0.7
        )
        
        print(f"\nValidation Results:")
        print(f"  is_heading_only: {is_heading} (should be False)")
        print(f"  contains_temporal_marker: {has_temporal} (should be True)")
        print(f"  has_structured_evidence: {has_evidence} (should be True)")
        print(f"  confidence_score: {confidence:.2f} (should be >= 0.7)")
        print(f"  PASSES VALIDATION: {passes_validation}")
        
        expected = test['should_pass']
        status = "✓ PASS" if passes_validation == expected else "✗ FAIL"
        print(f"\n{status}: Expected={expected}, Got={passes_validation}")
        
        results.append({
            "test": test['name'],
            "expected": expected,
            "actual": passes_validation,
            "passed": passes_validation == expected
        })
    
    return results


def test_production_scenario_2():
    """
    Test Case 2: Content that should NOT be flagged (negative test case)
    Simulates false positives that validation should reject
    """
    print("\n" + "="*80)
    print("TEST 2: False positives that should be REJECTED")
    print("="*80)
    
    test_cases = [
        {
            "name": "Heading without temporal content",
            "flagged_text": "Home-Buying Loan Types",
            "reasoning": "The section titled 'Home-Buying Loan Types' is likely outdated",
            "should_pass": False
        },
        {
            "name": "Category title without dates",
            "flagged_text": "Types of Mortgages Available",
            "reasoning": "This section may be outdated as it appears to be from before 2025",
            "should_pass": False
        },
        {
            "name": "Vague reasoning without evidence",
            "flagged_text": "Introduction to Lending",
            "reasoning": "This content possibly refers to older information",
            "should_pass": False
        },
        {
            "name": "Low confidence flag",
            "flagged_text": "Financial products overview from 2024",
            "reasoning": "Unclear if this is current. May be outdated. Confidence: 40%",
            "should_pass": False
        }
    ]
    
    results = []
    for test in test_cases:
        print(f"\n--- {test['name']} ---")
        print(f"Flagged Text: {test['flagged_text']}")
        print(f"Reasoning: {test['reasoning'][:100]}...")
        
        is_heading = is_heading_only(test['flagged_text'])
        has_temporal = contains_temporal_marker(test['flagged_text'])
        has_evidence = has_structured_evidence(test['reasoning'])
        confidence = extract_confidence_from_reasoning(test['reasoning'])
        
        passes_validation = (
            not is_heading and 
            has_temporal and 
            has_evidence and 
            confidence >= 0.7
        )
        
        print(f"\nValidation Results:")
        print(f"  is_heading_only: {is_heading}")
        print(f"  contains_temporal_marker: {has_temporal}")
        print(f"  has_structured_evidence: {has_evidence}")
        print(f"  confidence_score: {confidence:.2f}")
        print(f"  PASSES VALIDATION: {passes_validation}")
        
        if not passes_validation:
            print(f"  Rejection reasons:")
            if is_heading:
                print(f"    - flaggedText is heading only")
            if not has_temporal:
                print(f"    - No temporal marker in flaggedText")
            if not has_evidence:
                print(f"    - Reasoning lacks structured evidence")
            if confidence < 0.7:
                print(f"    - Confidence {confidence:.2f} below 0.7 threshold")
        
        expected = test['should_pass']
        status = "✓ PASS" if passes_validation == expected else "✗ FAIL"
        print(f"\n{status}: Expected={expected}, Got={passes_validation}")
        
        results.append({
            "test": test['name'],
            "expected": expected,
            "actual": passes_validation,
            "passed": passes_validation == expected
        })
    
    return results


def test_environment_detection():
    """
    Test Case 3: Environment-specific configuration detection
    """
    print("\n" + "="*80)
    print("TEST 3: Environment Configuration Detection")
    print("="*80)
    
    try:
        from config import settings
        print(f"\n✓ Configuration loaded successfully")
        print(f"  App Environment: {settings.app_env}")
        print(f"  Claude API Key: {'***' if settings.claude_api_key else 'MISSING'}")
        
        # Check if we're in production-like environment
        is_production = settings.app_env.lower() in ['production', 'prod']
        print(f"\n  Is Production Environment: {is_production}")
        
        if is_production:
            print(f"\n⚠️  WARNING: Running in production environment")
            print(f"  Production environments may have:")
            print(f"    - Different logging configurations")
            print(f"    - Rate limiting on Claude API")
            print(f"    - Different model versions")
            print(f"    - Network latency issues")
        
        return True
    except Exception as e:
        print(f"\n✗ Failed to load configuration: {e}")
        return False


def test_claude_response_parsing():
    """
    Test Case 4: Claude response parsing edge cases
    """
    print("\n" + "="*80)
    print("TEST 4: Claude Response Parsing Edge Cases")
    print("="*80)
    
    test_responses = [
        {
            "name": "Valid JSON array",
            "response": '[{"description": "Test", "flaggedText": "2023 data", "reasoning": "Found Date: 2023"}]',
            "should_parse": True
        },
        {
            "name": "JSON with extra text before",
            "response": 'Here are the issues:\n[{"description": "Test", "flaggedText": "2023 data", "reasoning": "Found Date: 2023"}]',
            "should_parse": True
        },
        {
            "name": "JSON with extra text after",
            "response": '[{"description": "Test", "flaggedText": "2023 data", "reasoning": "Found Date: 2023"}]\nThese are the stale items.',
            "should_parse": True
        },
        {
            "name": "Empty array",
            "response": '[]',
            "should_parse": True
        },
        {
            "name": "Malformed JSON",
            "response": '[{"description": "Test", "flaggedText": "2023 data"',
            "should_parse": False
        }
    ]
    
    results = []
    for test in test_responses:
        print(f"\n--- {test['name']} ---")
        print(f"Response: {test['response'][:80]}...")
        
        try:
            start_idx = test['response'].find('[')
            end_idx = test['response'].rfind(']') + 1
            
            if start_idx != -1 and end_idx > start_idx:
                json_str = test['response'][start_idx:end_idx]
                issues = json.loads(json_str)
                parsed = True
                print(f"✓ Parsed successfully: {len(issues)} issues")
            else:
                parsed = False
                print(f"✗ No JSON array found")
        except json.JSONDecodeError as e:
            parsed = False
            print(f"✗ JSON decode error: {e}")
        
        expected = test['should_parse']
        status = "✓ PASS" if parsed == expected else "✗ FAIL"
        print(f"{status}: Expected={expected}, Got={parsed}")
        
        results.append({
            "test": test['name'],
            "expected": expected,
            "actual": parsed,
            "passed": parsed == expected
        })
    
    return results


def generate_diagnostic_report(all_results):
    """Generate comprehensive diagnostic report"""
    print("\n" + "="*80)
    print("DIAGNOSTIC REPORT SUMMARY")
    print("="*80)
    print(f"Timestamp: {datetime.now().isoformat()}")
    
    total_tests = sum(len(results) for results in all_results.values())
    total_passed = sum(
        sum(1 for r in results if r['passed']) 
        for results in all_results.values()
    )
    
    print(f"\nOverall Results: {total_passed}/{total_tests} tests passed")
    
    for category, results in all_results.items():
        category_passed = sum(1 for r in results if r['passed'])
        category_total = len(results)
        print(f"\n{category}: {category_passed}/{category_total} passed")
        
        for result in results:
            status = "✓" if result['passed'] else "✗"
            print(f"  {status} {result['test']}")
            if not result['passed']:
                print(f"    Expected: {result['expected']}, Got: {result['actual']}")
    
    # Identify potential production issues
    print("\n" + "="*80)
    print("POTENTIAL PRODUCTION ISSUES")
    print("="*80)
    
    if total_passed < total_tests:
        print("\n⚠️  Some tests failed. Potential causes:")
        print("  1. Validation logic may not be working as expected")
        print("  2. Test cases may not match production scenarios")
        print("  3. Environment-specific differences in behavior")
    else:
        print("\n✓ All tests passed locally")
        print("\nIf production is still failing, likely causes:")
        print("  1. LOGGING VISIBILITY: Production logs not being captured/monitored")
        print("  2. CLAUDE API DIFFERENCES: Different model behavior under load")
        print("  3. RATE LIMITING: API throttling affecting response quality")
        print("  4. NETWORK LATENCY: Timeouts causing incomplete responses")
        print("  5. ENVIRONMENT VARIABLES: Different config in production")
    
    print("\n" + "="*80)
    print("RECOMMENDED NEXT STEPS")
    print("="*80)
    print("\n1. Check production logs for [CRITICAL VALIDATION SUMMARY] entries")
    print("2. Verify Claude API responses are complete (check [CLAUDE RESPONSE DEBUG])")
    print("3. Compare validation rejection counts between localhost and production")
    print("4. Monitor for rate limiting or timeout errors in production")
    print("5. Ensure production environment variables match localhost")
    
    return total_passed == total_tests


def main():
    """Run all diagnostic tests"""
    print("="*80)
    print("PRODUCTION DIAGNOSIS: STALE CONTENT DETECTION")
    print("="*80)
    print(f"Started: {datetime.now().isoformat()}")
    
    all_results = {}
    
    # Run environment detection first
    env_ok = test_environment_detection()
    
    if not env_ok:
        print("\n⚠️  WARNING: Environment configuration issues detected")
        print("Some tests may not run correctly")
    
    # Run all test scenarios
    all_results['Positive Test Cases'] = test_production_scenario_1()
    all_results['Negative Test Cases'] = test_production_scenario_2()
    all_results['Response Parsing'] = test_claude_response_parsing()
    
    # Generate report
    success = generate_diagnostic_report(all_results)
    
    print(f"\nCompleted: {datetime.now().isoformat()}")
    
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())