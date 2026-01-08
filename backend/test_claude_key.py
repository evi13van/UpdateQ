#!/usr/bin/env python3
"""Test script to validate Claude API key"""

import sys
from anthropic import Anthropic
from config import settings

def test_claude_api_key():
    """Test if the Claude API key is valid"""
    print("🔑 Testing Claude API Key...")
    print(f"   Key prefix: {settings.claude_api_key[:20]}...")
    
    try:
        # Create Anthropic client
        client = Anthropic(api_key=settings.claude_api_key)
        
        # Make a simple API call
        print("📡 Making test API call...")
        message = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=50,
            messages=[
                {
                    "role": "user",
                    "content": "Say 'API key is valid' if you can read this."
                }
            ]
        )
        
        response_text = message.content[0].text
        print(f"✅ SUCCESS! Claude API key is valid")
        print(f"   Response: {response_text}")
        return True
        
    except Exception as e:
        print(f"❌ FAILED! Claude API key validation error")
        print(f"   Error Type: {type(e).__name__}")
        print(f"   Error Message: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_claude_api_key()
    sys.exit(0 if success else 1)