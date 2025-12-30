#!/usr/bin/env python3
"""Test Firecrawl API to diagnose URL access issues"""

import asyncio
from firecrawl import FirecrawlApp
from config import settings

async def test_url(url: str):
    """Test accessing a URL via Firecrawl"""
    print(f"\n{'='*60}")
    print(f"Testing URL: {url}")
    print(f"{'='*60}\n")
    
    try:
        # Initialize Firecrawl client
        app = FirecrawlApp(api_key=settings.firecrawl_api_key)
        print("✓ Firecrawl client initialized")
        
        # Try to scrape the URL
        print(f"Attempting to scrape URL...")
        result = app.scrape(
            url,
            formats=["markdown", "html"],
            include_tags=["title", "h1", "h2", "h3", "h4", "h5", "h6", "p"],
            exclude_tags=["script", "style", "nav", "footer", "header"]
        )
        
        print(f"\n✓ SUCCESS! URL accessed successfully")
        print(f"\nResponse type: {type(result)}")
        print(f"Response keys: {result.keys() if isinstance(result, dict) else 'N/A'}")
        
        if isinstance(result, dict):
            if result.get('error'):
                print(f"\n✗ ERROR in response: {result.get('error')}")
            else:
                data = result.get('data', result)
                if isinstance(data, dict):
                    print(f"\nTitle: {data.get('metadata', {}).get('title', 'N/A')}")
                    markdown = data.get('markdown', '')
                    print(f"Content length: {len(markdown)} characters")
                    print(f"Content preview: {markdown[:200]}...")
        
        return True
        
    except Exception as e:
        print(f"\n✗ FAILED with exception:")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        
        # Check for specific error types
        error_msg = str(e).lower()
        if "rate limit" in error_msg or "429" in error_msg:
            print("\n⚠️  DIAGNOSIS: Rate limit exceeded")
            print("   Solution: Wait a few minutes or upgrade your Firecrawl plan")
        elif "403" in error_msg or "forbidden" in error_msg:
            print("\n⚠️  DIAGNOSIS: Access forbidden by website")
            print("   Solution: Website may be blocking automated access")
        elif "404" in error_msg or "not found" in error_msg:
            print("\n⚠️  DIAGNOSIS: Page not found")
            print("   Solution: Check if URL is correct and page exists")
        elif "timeout" in error_msg or "timed out" in error_msg:
            print("\n⚠️  DIAGNOSIS: Request timeout")
            print("   Solution: Website may be slow or blocking requests")
        elif "api key" in error_msg or "unauthorized" in error_msg or "401" in error_msg:
            print("\n⚠️  DIAGNOSIS: API key issue")
            print("   Solution: Check your Firecrawl API key in .env file")
        else:
            print("\n⚠️  DIAGNOSIS: Unknown error")
            print("   Solution: Check Firecrawl dashboard for more details")
        
        return False

async def main():
    """Test multiple URLs"""
    test_urls = [
        "https://www.cdc.gov/coronavirus/2019-ncov/index.html",
        "https://example.com",  # Simple test URL
    ]
    
    print("\n" + "="*60)
    print("FIRECRAWL API DIAGNOSTIC TEST")
    print("="*60)
    print(f"\nAPI Key configured: {'Yes' if settings.firecrawl_api_key else 'No'}")
    print(f"API Key (first 10 chars): {settings.firecrawl_api_key[:10]}..." if settings.firecrawl_api_key else "Not set")
    
    results = {}
    for url in test_urls:
        results[url] = await test_url(url)
        await asyncio.sleep(2)  # Wait between requests
    
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    for url, success in results.items():
        status = "✓ SUCCESS" if success else "✗ FAILED"
        print(f"{status}: {url}")
    
    print("\n")

if __name__ == "__main__":
    asyncio.run(main())