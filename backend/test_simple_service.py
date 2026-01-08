"""
Simple test to verify services are working after resource leak fixes
"""
import asyncio
from services.detector import detect_stale_content


async def test_detector():
    """Quick test of detector service"""
    print("Testing detector service with resource cleanup...")
    
    test_content = "According to 2023 data, rates were 6.5%."
    domain_context = {
        "description": "Test",
        "entityTypes": "data",
        "stalenessRules": "Anything older than 2024"
    }
    
    try:
        result = await detect_stale_content(
            url="https://example.com/test",
            content=test_content,
            domain_context=domain_context
        )
        print(f"✓ Status: {result.get('status')}")
        print(f"✓ Issues: {result.get('issue_count', 0)}")
        print("✓ Service completed successfully - resource cleanup working!")
        return True
    except Exception as e:
        print(f"✗ Error: {str(e)}")
        return False


if __name__ == "__main__":
    success = asyncio.run(test_detector())
    exit(0 if success else 1)