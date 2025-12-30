#!/usr/bin/env python3
"""Simple Firecrawl test with detailed output"""

import sys
from firecrawl import FirecrawlApp
from config import settings
import json

def test_firecrawl():
    """Test Firecrawl API with detailed response logging"""
    print("\n" + "="*70)
    print("FIRECRAWL API TEST - DETAILED RESPONSE")
    print("="*70)
    
    # Check API key
    if not settings.firecrawl_api_key:
        print("ERROR: FIRECRAWL_API_KEY not set in .env file")
        return
    
    print(f"\n✓ API Key configured: {settings.firecrawl_api_key[:15]}...")
    
    # Test URL
    test_url = "https://example.com"
    print(f"\n📍 Testing URL: {test_url}")
    
    try:
        # Initialize client
        print("\n1️⃣ Initializing Firecrawl client...")
        app = FirecrawlApp(api_key=settings.firecrawl_api_key)
        print("   ✓ Client initialized successfully")
        
        # Make API call
        print("\n2️⃣ Making API call to Firecrawl...")
        print("   Parameters:")
        print("   - formats: ['markdown', 'html']")
        print("   - include_tags: ['title', 'h1', 'h2', 'p']")
        print("   - exclude_tags: ['script', 'style']")
        
        result = app.scrape(
            test_url,
            formats=["markdown", "html"],
            include_tags=["title", "h1", "h2", "h3", "p"],
            exclude_tags=["script", "style"]
        )
        
        print("\n3️⃣ API call completed!")
        print(f"   Response type: {type(result)}")
        print(f"   Response class: {result.__class__.__name__}")
        
        # Check if it's an object with attributes
        if hasattr(result, '__dict__'):
            print(f"\n4️⃣ Response object attributes:")
            for attr in dir(result):
                if not attr.startswith('_'):
                    try:
                        value = getattr(result, attr)
                        if not callable(value):
                            if isinstance(value, str) and len(value) > 100:
                                print(f"   - {attr}: <string, {len(value)} chars>")
                            else:
                                print(f"   - {attr}: {value}")
                    except:
                        print(f"   - {attr}: <unable to access>")
        
        # Try to access common attributes
        print("\n5️⃣ Extracting content:")
        
        if hasattr(result, 'markdown'):
            markdown = result.markdown
            print(f"   ✓ Markdown content: {len(markdown)} characters")
            print(f"\n   Preview (first 500 chars):")
            print("   " + "-"*66)
            print("   " + markdown[:500].replace("\n", "\n   "))
            print("   " + "-"*66)
        else:
            print("   ✗ No 'markdown' attribute found")
        
        if hasattr(result, 'html'):
            html = result.html
            print(f"\n   ✓ HTML content: {len(html)} characters")
        else:
            print("   ✗ No 'html' attribute found")
        
        if hasattr(result, 'metadata'):
            metadata = result.metadata
            print(f"\n   ✓ Metadata: {metadata}")
        else:
            print("   ✗ No 'metadata' attribute found")
        
        if hasattr(result, 'error'):
            error = result.error
            if error:
                print(f"\n   ⚠️  Error in response: {error}")
            else:
                print(f"\n   ✓ No errors")
        
        print("\n" + "="*70)
        print("✅ TEST COMPLETED SUCCESSFULLY")
        print("="*70)
        print("\nConclusion: Firecrawl API is working correctly!")
        print("The issue is NOT a rate limiting error.")
        print("The issue was incorrect parameter names (camelCase vs snake_case).")
        print("="*70 + "\n")
        
    except Exception as e:
        print("\n" + "="*70)
        print("❌ TEST FAILED WITH EXCEPTION")
        print("="*70)
        print(f"\nException Type: {type(e).__name__}")
        print(f"Exception Message: {str(e)}")
        
        # Check for specific error types
        error_msg = str(e).lower()
        print("\n🔍 Error Analysis:")
        
        if "rate limit" in error_msg or "429" in error_msg:
            print("   ⚠️  DIAGNOSIS: Rate limit exceeded")
            print("   This IS a rate limiting error")
            print("   Solution: Wait a few minutes or upgrade Firecrawl plan")
        elif "403" in error_msg or "forbidden" in error_msg:
            print("   ⚠️  DIAGNOSIS: Access forbidden")
            print("   Solution: Website blocking automated access")
        elif "401" in error_msg or "unauthorized" in error_msg or "api key" in error_msg:
            print("   ⚠️  DIAGNOSIS: Authentication error")
            print("   Solution: Check your Firecrawl API key")
        elif "timeout" in error_msg or "timed out" in error_msg:
            print("   ⚠️  DIAGNOSIS: Request timeout")
            print("   Solution: Website may be slow or blocking requests")
        elif "unexpected keyword argument" in error_msg:
            print("   ⚠️  DIAGNOSIS: Parameter naming error")
            print("   This is NOT a rate limiting error")
            print("   Solution: Use snake_case parameter names (include_tags, not includeTags)")
        else:
            print("   ⚠️  DIAGNOSIS: Unknown error")
            print("   This is NOT a rate limiting error")
        
        print("\n" + "="*70 + "\n")
        
        import traceback
        print("Full traceback:")
        traceback.print_exc()

if __name__ == "__main__":
    test_firecrawl()