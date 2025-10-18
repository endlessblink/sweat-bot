#!/usr/bin/env python3
"""
Manual SweatBot Hebrew AI Test
Tests the OpenAI integration by sending Hebrew messages via the backend API
"""

import requests
import json
import time
from datetime import datetime

class SweatBotHebrewTester:
    def __init__(self):
        self.backend_url = "http://localhost:8000"
        self.frontend_url = "http://localhost:8005"

    def test_backend_health(self):
        """Test backend health"""
        try:
            response = requests.get(f"{self.backend_url}/health/detailed", timeout=5)
            if response.status_code == 200:
                health_data = response.json()
                print(f"✅ Backend Health: {health_data.get('status', 'unknown')}")
                print(f"   Database: {health_data.get('components', {}).get('database', {}).get('status', 'unknown')}")
                print(f"   WebSocket: {health_data.get('components', {}).get('websocket', {}).get('status', 'unknown')}")
                return True
            else:
                print(f"❌ Backend Health Check Failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Backend Health Check Error: {e}")
            return False

    def test_frontend_access(self):
        """Test frontend accessibility"""
        try:
            response = requests.get(self.frontend_url, timeout=5)
            if response.status_code == 200:
                print("✅ Frontend accessible")
                return True
            else:
                print(f"❌ Frontend not accessible: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Frontend access error: {e}")
            return False

    def get_auth_token(self):
        """Get or create guest token"""
        try:
            headers = {"Content-Type": "application/json"}
            response = requests.post(f"{self.backend_url}/auth/guest", headers=headers, json={}, timeout=5)
            if response.status_code == 200:
                token_data = response.json()
                return token_data.get("access_token")
            else:
                print(f"❌ Failed to get auth token: {response.status_code}")
                print(f"   Response: {response.text}")
                return None
        except Exception as e:
            print(f"❌ Auth token error: {e}")
            return None

    def test_hebrew_ai_response(self, token: str, message: str):
        """Test Hebrew AI response via backend API"""
        try:
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }

            payload = {
                "messages": [
                    {
                        "role": "user",
                        "content": message
                    }
                ],
                "stream": False,
                "temperature": 0.7
            }

            print(f"🔄 Sending Hebrew message: {message}")
            response = requests.post(
                f"{self.backend_url}/api/v1/ai/chat",
                headers=headers,
                json=payload,
                timeout=30
            )

            if response.status_code == 200:
                ai_response = response.json()
                # Handle different response formats
                if "choices" in ai_response and len(ai_response["choices"]) > 0:
                    ai_message = ai_response["choices"][0]["message"]["content"]
                elif "response" in ai_response:
                    ai_message = ai_response["response"]
                elif "content" in ai_response:
                    ai_message = ai_response["content"]
                else:
                    ai_message = str(ai_response)

                print(f"✅ AI Response received:")
                print(f"   Length: {len(ai_message)} characters")
                hebrew_chars = any('\u0590' <= char <= '\u05FF' for char in ai_message)
                print(f"   Contains Hebrew: {'Yes' if hebrew_chars else 'No'}")
                print(f"   Response: {ai_message[:200]}...")

                return {
                    "success": True,
                    "hebrew": any('\u0590' <= char <= '\u05FF' for char in ai_message),
                    "response": ai_message,
                    "length": len(ai_message)
                }
            else:
                error_text = response.text
                print(f"❌ AI request failed: {response.status_code}")
                print(f"   Error: {error_text}")
                return {
                    "success": False,
                    "error": f"HTTP {response.status_code}: {error_text}"
                }

        except Exception as e:
            print(f"❌ AI request error: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    def run_comprehensive_test(self):
        """Run comprehensive Hebrew AI test"""
        print("🚀 Starting SweatBot Hebrew AI Test")
        print(f"📅 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 60)

        # Test 1: Backend Health
        print("\n1️⃣ Testing Backend Health")
        if not self.test_backend_health():
            print("❌ Backend not healthy - stopping test")
            return False

        # Test 2: Frontend Access
        print("\n2️⃣ Testing Frontend Access")
        if not self.test_frontend_access():
            print("❌ Frontend not accessible - stopping test")
            return False

        # Test 3: Get Authentication Token
        print("\n3️⃣ Getting Authentication Token")
        token = self.get_auth_token()
        if not token:
            print("❌ Cannot get auth token - stopping test")
            return False
        print(f"✅ Auth token obtained: {token[:20]}...")

        # Test 4: Hebrew AI Responses
        print("\n4️⃣ Testing Hebrew AI Responses")
        test_messages = [
            "שלום, אני רוצה להתחיל אימון כוח היום",
            "איזה תרגילים מומלצים למתחילים?",
            "כמה זמן צריך להתאמן ביום?",
            "מה ההבדל בין אימון אירובי לאימון כוח?"
        ]

        results = []
        for i, message in enumerate(test_messages, 1):
            print(f"\n   Test 4.{i}: {message}")
            result = self.test_hebrew_ai_response(token, message)
            results.append(result)
            time.sleep(2)  # Small delay between requests

        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)

        successful_tests = sum(1 for r in results if r.get("success", False))
        hebrew_responses = sum(1 for r in results if r.get("hebrew", False))

        print(f"✅ Successful AI responses: {successful_tests}/{len(results)}")
        print(f"🌐 Hebrew responses: {hebrew_responses}/{len(results)}")

        if successful_tests == len(results) and hebrew_responses > 0:
            print("🎉 ALL TESTS PASSED - OpenAI Hebrew integration working!")
            return True
        else:
            print("⚠️ Some tests failed - Check results above")
            return False

if __name__ == "__main__":
    tester = SweatBotHebrewTester()
    success = tester.run_comprehensive_test()
    exit(0 if success else 1)