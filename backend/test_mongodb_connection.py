#!/usr/bin/env python3
"""
MongoDB Connection Diagnostic Tool
Tests MongoDB Atlas connectivity with detailed error reporting
"""
import asyncio
import sys
from motor.motor_asyncio import AsyncIOMotorClient
import certifi
from config import settings


async def test_connection():
    """Test MongoDB connection with detailed diagnostics"""
    print("=" * 60)
    print("MongoDB Connection Diagnostic Test")
    print("=" * 60)
    
    # Step 1: Verify configuration
    print("\n📋 Step 1: Verifying Configuration")
    print(f"   MongoDB URI: {'✅ Present' if settings.mongodb_uri else '❌ Missing'}")
    if settings.mongodb_uri:
        # Mask password in URI for display
        masked_uri = settings.mongodb_uri
        if '@' in masked_uri:
            parts = masked_uri.split('@')
            if ':' in parts[0]:
                user_pass = parts[0].split('://')[-1]
                if ':' in user_pass:
                    user = user_pass.split(':')[0]
                    masked_uri = masked_uri.replace(user_pass, f"{user}:***")
        print(f"   URI Format: {masked_uri[:80]}...")
    
    print(f"   Certifi Path: {certifi.where()}")
    
    # Step 2: Test DNS resolution
    print("\n🌐 Step 2: Testing DNS Resolution")
    try:
        import socket
        # Extract hostname from URI
        if '@' in settings.mongodb_uri:
            hostname = settings.mongodb_uri.split('@')[1].split('/')[0].split(':')[0]
            print(f"   Hostname: {hostname}")
            ip = socket.gethostbyname(hostname.split(',')[0])
            print(f"   ✅ DNS Resolution: {ip}")
    except Exception as e:
        print(f"   ❌ DNS Resolution Failed: {e}")
    
    # Step 3: Test MongoDB connection
    print("\n🔌 Step 3: Testing MongoDB Connection")
    client = None
    try:
        print("   Creating client with SSL/TLS...")
        client = AsyncIOMotorClient(
            settings.mongodb_uri,
            tlsCAFile=certifi.where(),
            serverSelectionTimeoutMS=10000,  # 10 second timeout
            connectTimeoutMS=10000,
            socketTimeoutMS=10000
        )
        
        print("   Attempting to ping MongoDB...")
        result = await client.admin.command('ping')
        print(f"   ✅ Connection Successful!")
        print(f"   Ping Result: {result}")
        
        # Test database access
        print("\n📊 Step 4: Testing Database Access")
        db = client.updateq
        collections = await db.list_collection_names()
        print(f"   ✅ Database 'updateq' accessible")
        print(f"   Collections: {collections if collections else 'No collections yet'}")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Connection Failed!")
        print(f"\n🔍 Error Details:")
        print(f"   Error Type: {type(e).__name__}")
        print(f"   Error Message: {str(e)}")
        
        # Provide specific guidance based on error type
        error_str = str(e).lower()
        print(f"\n💡 Likely Causes:")
        
        if 'ssl' in error_str or 'tls' in error_str:
            print("   1. ⚠️  IP WHITELIST ISSUE (Most Likely)")
            print("      → MongoDB Atlas is blocking your IP address")
            print("      → Action: Add 0.0.0.0/0 to Network Access in Atlas")
            print()
            print("   2. SSL/TLS Configuration")
            print("      → Check MongoDB Atlas TLS version requirements")
            
        elif 'authentication' in error_str or 'auth' in error_str:
            print("   1. Invalid credentials in MONGODB_URI")
            print("   2. User doesn't have proper permissions")
            
        elif 'timeout' in error_str:
            print("   1. Network connectivity issues")
            print("   2. Firewall blocking outbound connections")
            print("   3. IP whitelist restrictions")
            
        else:
            print("   1. Check MONGODB_URI format")
            print("   2. Verify MongoDB Atlas cluster is running")
            print("   3. Check network connectivity")
        
        return False
        
    finally:
        if client:
            client.close()
            print("\n🔒 Connection closed")


async def main():
    try:
        success = await test_connection()
        print("\n" + "=" * 60)
        if success:
            print("✅ ALL TESTS PASSED - MongoDB is properly configured!")
        else:
            print("❌ TESTS FAILED - See error details above")
        print("=" * 60)
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ FATAL ERROR: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())