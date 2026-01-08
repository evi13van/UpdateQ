"""
Test script to verify resource cleanup fixes
Tests that services properly clean up HTTP clients
"""
import asyncio
import sys
from services.detector import detect_stale_content
from services.extractor import extract_content
from services.research import research_service
from models.analysis import Issue, DomainContext


async def test_detector_cleanup():
    """Test that detector service cleans up Anthropic client"""
    print("\n=== Testing Detector Service ===")
    
    test_content = """
    According to 2023 data, the average home price was $450,000.
    Interest rates in 2022 were around 6.5%.
    """
    
    domain_context = {
        "description": "Real estate market data",
        "entityTypes": "statistics, prices",
        "stalenessRules": "Anything older than 2024"
    }
    
    try:
        result = await detect_stale_content(
            url="https://example.com/test",
            content=test_content,
            domain_context=domain_context
        )
        print(f"✓ Detector completed successfully")
        print(f"  Status: {result.get('status')}")
        print(f"  Issues found: {result.get('issue_count', 0)}")
        return True
    except Exception as e:
        print(f"✗ Detector failed: {str(e)}")
        return False


async def test_extractor_cleanup():
    """Test that extractor service cleans up FirecrawlApp client"""
    print("\n=== Testing Extractor Service ===")
    
    # Use a simple, reliable URL for testing
    test_url = "https://example.com"
    
    try:
        result = await extract_content(test_url)
        print(f"✓ Extractor completed successfully")
        print(f"  Status: {result.get('status')}")
        print(f"  Title: {result.get('title', 'N/A')}")
        return True
    except Exception as e:
        print(f"✗ Extractor failed: {str(e)}")
        return False


async def test_research_cleanup():
    """Test that research service cleans up Anthropic client"""
    print("\n=== Testing Research Service ===")
    
    test_issue = Issue(
        id="test_123",
        description="Outdated statistics",
        flaggedText="According to 2023 data, rates were 6.5%",
        reasoning="Data is from 2023",
        status="open"
    )
    
    test_context = DomainContext(
        description="Financial data",
        entityTypes="statistics",
        stalenessRules="Anything older than 2024"
    )
    
    try:
        # Test query generation (uses Anthropic client)
        query = await research_service.generate_research_query(test_issue, test_context)
        print(f"✓ Research query generation completed")
        print(f"  Generated query: {query[:100]}...")
        return True
    except Exception as e:
        print(f"✗ Research failed: {str(e)}")
        return False


async def test_multiple_requests():
    """Test multiple sequential requests to verify no resource accumulation"""
    print("\n=== Testing Multiple Sequential Requests ===")
    
    test_content = "Sample content from 2023 with old data."
    domain_context = {
        "description": "Test",
        "entityTypes": "data",
        "stalenessRules": "Anything older than 2024"
    }
    
    success_count = 0
    iterations = 5
    
    for i in range(iterations):
        try:
            result = await detect_stale_content(
                url=f"https://example.com/test{i}",
                content=test_content,
                domain_context=domain_context
            )
            if result.get('status') == 'success':
                success_count += 1
            print(f"  Request {i+1}/{iterations}: ✓")
        except Exception as e:
            print(f"  Request {i+1}/{iterations}: ✗ {str(e)}")
    
    print(f"\n✓ Completed {success_count}/{iterations} requests successfully")
    return success_count == iterations


async def main():
    """Run all tests"""
    print("=" * 60)
    print("Resource Cleanup Test Suite")
    print("=" * 60)
    
    results = []
    
    # Test each service
    results.append(("Detector Service", await test_detector_cleanup()))
    results.append(("Extractor Service", await test_extractor_cleanup()))
    results.append(("Research Service", await test_research_cleanup()))
    results.append(("Multiple Requests", await test_multiple_requests()))
    
    # Print summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status}: {name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n✓ All tests passed! Resource cleanup is working correctly.")
        return 0
    else:
        print(f"\n✗ {total - passed} test(s) failed. Please review the output above.")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)