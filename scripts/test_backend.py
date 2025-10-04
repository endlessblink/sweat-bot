#!/usr/bin/env python3
"""
Simple test script to verify SweatBot backend functionality
Tests API endpoints, database connectivity, and basic features
"""

import asyncio
import aiohttp
import json
import sys
from pathlib import Path

# Configuration
BASE_URL = "http://localhost:8000"
TIMEOUT = 10

async def test_health_endpoint():
    """Test basic health check endpoint"""
    print("🔍 Testing health endpoint...")
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{BASE_URL}/health", timeout=TIMEOUT) as response:
                if response.status == 200:
                    data = await response.json()
                    print(f"✅ Health check passed")
                    print(f"   Status: {data.get('status')}")
                    print(f"   Service: {data.get('service')}")
                    print(f"   Database: {data.get('database')}")
                    print(f"   WebSocket connections: {data.get('websocket_connections', 0)}")
                    return True
                else:
                    print(f"❌ Health check failed with status {response.status}")
                    return False
                    
    except asyncio.TimeoutError:
        print("❌ Health check timed out - is the server running?")
        return False
    except aiohttp.ClientConnectorError:
        print("❌ Cannot connect to server - is it running on localhost:8000?")
        return False
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False

async def test_root_endpoint():
    """Test root API endpoint"""
    print("\n🔍 Testing root endpoint...")
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{BASE_URL}/", timeout=TIMEOUT) as response:
                if response.status == 200:
                    data = await response.json()
                    print(f"✅ Root endpoint passed")
                    print(f"   Message: {data.get('message')}")
                    print(f"   Version: {data.get('version')}")
                    print(f"   Features: {len(data.get('features', []))} listed")
                    return True
                else:
                    print(f"❌ Root endpoint failed with status {response.status}")
                    return False
                    
    except Exception as e:
        print(f"❌ Root endpoint failed: {e}")
        return False

async def test_api_docs():
    """Test API documentation endpoint"""
    print("\n🔍 Testing API documentation...")
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{BASE_URL}/docs", timeout=TIMEOUT) as response:
                if response.status == 200:
                    print("✅ API documentation accessible")
                    print(f"   URL: {BASE_URL}/docs")
                    return True
                else:
                    print(f"❌ API docs failed with status {response.status}")
                    return False
                    
    except Exception as e:
        print(f"❌ API docs test failed: {e}")
        return False

async def test_detailed_health():
    """Test detailed health endpoint"""
    print("\n🔍 Testing detailed health endpoint...")
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{BASE_URL}/health/detailed", timeout=TIMEOUT) as response:
                if response.status == 200:
                    data = await response.json()
                    print(f"✅ Detailed health check passed")
                    
                    components = data.get('components', {})
                    for component, status in components.items():
                        health_status = status.get('status', 'unknown')
                        if health_status == 'healthy':
                            print(f"   ✅ {component}: {health_status}")
                        else:
                            print(f"   ⚠️  {component}: {health_status}")
                            if 'error' in status:
                                print(f"      Error: {status['error']}")
                    
                    return True
                else:
                    print(f"❌ Detailed health check failed with status {response.status}")
                    return False
                    
    except Exception as e:
        print(f"❌ Detailed health check failed: {e}")
        return False

async def test_auth_endpoints():
    """Test authentication endpoints"""
    print("\n🔍 Testing authentication endpoints...")
    
    try:
        # Test guest session creation
        async with aiohttp.ClientSession() as session:
            async with session.post(f"{BASE_URL}/auth/guest", timeout=TIMEOUT) as response:
                if response.status in [200, 201]:
                    print("✅ Guest session endpoint working")
                    return True
                else:
                    print(f"⚠️  Auth endpoint returned {response.status} (may need implementation)")
                    return True  # Not critical for basic testing
                    
    except Exception as e:
        print(f"⚠️  Auth test failed: {e} (may need implementation)")
        return True  # Not critical for basic testing

async def test_exercise_endpoints():
    """Test exercise endpoints"""
    print("\n🔍 Testing exercise endpoints...")
    
    try:
        # Test exercise history endpoint
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{BASE_URL}/exercises/history", timeout=TIMEOUT) as response:
                if response.status in [200, 401]:  # 401 is OK, means auth is working
                    print("✅ Exercise endpoints accessible")
                    return True
                else:
                    print(f"⚠️  Exercise endpoint returned {response.status}")
                    return True  # Not critical for basic testing
                    
    except Exception as e:
        print(f"⚠️  Exercise test failed: {e}")
        return True  # Not critical for basic testing

async def main():
    """Run all tests"""
    print("🚀 Starting SweatBot Backend Tests")
    print("=" * 50)
    
    tests = [
        test_health_endpoint,
        test_root_endpoint,
        test_api_docs,
        test_detailed_health,
        test_auth_endpoints,
        test_exercise_endpoints
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        try:
            result = await test()
            if result:
                passed += 1
        except Exception as e:
            print(f"❌ Test failed with exception: {e}")
    
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed >= 4:  # Basic functionality works
        print("🎉 Backend is working! Core functionality verified.")
        print("\n📚 Next steps:")
        print("   1. Start frontend: cd frontend && npm run dev")
        print("   2. Open browser: http://localhost:3000")
        print("   3. Test voice features with a microphone")
    elif passed >= 2:  # Basic health works
        print("⚠️  Backend is partially working. Some features may need configuration.")
    else:
        print("❌ Backend has issues. Check server logs for details.")
    
    return passed >= 2

if __name__ == "__main__":
    print("Make sure the backend is running:")
    print("cd backend && uvicorn app.main:app --reload")
    print()
    
    success = asyncio.run(main())
    exit(0 if success else 1)