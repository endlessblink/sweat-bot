#!/usr/bin/env python3
"""
SweatBot Frontend Test Suite
Comprehensive testing without Playwright MCP

Tests:
1. Natural Greetings (Multiple Times) - Verify responses are different
2. No Automatic UI Components - Verify no hardcoded quick actions
3. Non-Fitness Questions - Verify proper handling
4. Fitness Commands - Verify tool execution
5. Conversation Memory - Verify context retention
"""

import requests
import json
import time
import sys
from typing import Dict, Any, List
import re

class SweatBotTester:
    def __init__(self):
        self.backend_url = "http://localhost:8000"
        self.frontend_url = "http://localhost:8005"
        self.test_results = []
        
    def log_test(self, test_name: str, status: str, details: str, expected: str = "", actual: str = ""):
        """Log test results"""
        result = {
            "test": test_name,
            "status": status,
            "details": details,
            "expected": expected,
            "actual": actual,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        self.test_results.append(result)
        print(f"{'✅' if status == 'PASS' else '❌'} {test_name}: {status}")
        print(f"   {details}")
        if expected:
            print(f"   Expected: {expected}")
        if actual:
            print(f"   Actual: {actual}")
        print()
    
    def check_backend_health(self) -> bool:
        """Check if backend is healthy"""
        try:
            response = requests.get(f"{self.backend_url}/health", timeout=5)
            if response.status_code == 200:
                health_data = response.json()
                print(f"✅ Backend Health: {health_data.get('status', 'unknown')}")
                return True
            else:
                print(f"❌ Backend unhealthy: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Backend connection failed: {e}")
            return False
    
    def check_frontend_health(self) -> bool:
        """Check if frontend is serving"""
        try:
            response = requests.get(self.frontend_url, timeout=5)
            if response.status_code == 200 and "Vite + React" in response.text:
                print("✅ Frontend is serving")
                return True
            else:
                print(f"❌ Frontend issue: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Frontend connection failed: {e}")
            return False
    
    def send_chat_message(self, message: str, user_id: str = "test-user") -> Dict[str, Any]:
        """Send message to SweatBot backend"""
        try:
            payload = {
                "message": message,
                "user_id": user_id
            }
            response = requests.post(
                f"{self.backend_url}/chat/personal-sweatbot",
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            if response.status_code == 200:
                return {
                    "success": True,
                    "data": response.json(),
                    "status_code": response.status_code
                }
            else:
                return {
                    "success": False,
                    "error": f"HTTP {response.status_code}",
                    "response": response.text
                }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def test_natural_greetings_variation(self):
        """Test 1: Natural Greetings (Multiple Times) - Verify responses are different"""
        print("🔍 Test 1: Natural Greetings Variation")
        
        greetings = ["Hi", "Hi", "Hello", "שלום"]  # Two identical greetings
        responses = []
        
        for i, greeting in enumerate(greetings):
            result = self.send_chat_message(greeting, f"test-user-{i}")
            if result["success"]:
                response_text = result["data"].get("response", "")
                responses.append(response_text)
                print(f"   Greeting {i+1} ('{greeting}'): {response_text[:100]}...")
            else:
                self.log_test(
                    "Natural Greetings - API Call",
                    "FAIL",
                    f"Failed to get response for greeting {i+1}: {result.get('error', 'Unknown error')}"
                )
                return
        
        # Check if responses are different (not hardcoded)
        unique_responses = set(responses)
        if len(unique_responses) > 1:
            self.log_test(
                "Natural Greetings - Variation",
                "PASS",
                f"Got {len(unique_responses)} unique responses from {len(responses)} greetings",
                "Responses should vary (not hardcoded)",
                f"Unique responses: {len(unique_responses)}"
            )
        else:
            self.log_test(
                "Natural Greetings - Variation",
                "FAIL",
                "All responses were identical - likely hardcoded",
                "Different responses for same greeting",
                "All responses identical"
            )
        
        # Check for Hebrew support in responses
        hebrew_found = any(re.search(r'[\u0590-\u05FF]', resp) for resp in responses)
        if hebrew_found:
            self.log_test(
                "Hebrew Language Support",
                "PASS",
                "Found Hebrew text in responses"
            )
        else:
            self.log_test(
                "Hebrew Language Support", 
                "FAIL",
                "No Hebrew text found in responses"
            )
    
    def test_no_automatic_ui_components(self):
        """Test 2: No Automatic UI Components for greetings"""
        print("🔍 Test 2: No Automatic UI Components")
        
        result = self.send_chat_message("Hi")
        if result["success"]:
            data = result["data"]
            
            # Check for UI component in response
            has_ui_component = "ui_component" in data and data["ui_component"] is not None
            has_tool_executed = "tool_executed" in data and data["tool_executed"] is True
            
            if not has_ui_component and not has_tool_executed:
                self.log_test(
                    "No Automatic UI Components",
                    "PASS",
                    "No UI components generated for simple greeting",
                    "No ui_component or tool_executed in response",
                    f"ui_component: {data.get('ui_component')}, tool_executed: {data.get('tool_executed')}"
                )
            else:
                self.log_test(
                    "No Automatic UI Components",
                    "FAIL", 
                    "UI components were automatically generated for greeting",
                    "No ui_component for simple greeting",
                    f"Found ui_component: {has_ui_component}, tool_executed: {has_tool_executed}"
                )
        else:
            self.log_test(
                "No Automatic UI Components",
                "FAIL",
                f"Could not test - API call failed: {result.get('error')}"
            )
    
    def test_non_fitness_questions(self):
        """Test 3: Non-Fitness Questions - Should politely decline or redirect"""
        print("🔍 Test 3: Non-Fitness Questions")
        
        non_fitness_questions = [
            "מה השעה?",  # What time is it?
            "What's the weather?",
            "Tell me a joke",
            "מה קרה בחדשות?"  # What happened in the news?
        ]
        
        for question in non_fitness_questions:
            result = self.send_chat_message(question)
            if result["success"]:
                data = result["data"]
                response = data.get("response", "").lower()
                
                # Check that no tools were triggered
                tool_executed = data.get("tool_executed", False)
                
                # Check if response redirects to fitness or politely declines
                fitness_redirect = any(word in response for word in [
                    "כושר", "אימון", "fitness", "workout", "exercise",
                    "מצטער", "sorry", "עזור", "help"
                ])
                
                if not tool_executed and fitness_redirect:
                    self.log_test(
                        f"Non-Fitness Question: {question}",
                        "PASS",
                        "Politely declined/redirected without using tools"
                    )
                elif tool_executed:
                    self.log_test(
                        f"Non-Fitness Question: {question}",
                        "FAIL",
                        "Tools were triggered for non-fitness question",
                        "No tools should execute",
                        f"tool_executed: {tool_executed}"
                    )
                else:
                    self.log_test(
                        f"Non-Fitness Question: {question}",
                        "PARTIAL",
                        "No tools triggered but unclear redirect/decline"
                    )
    
    def test_fitness_commands(self):
        """Test 4: Fitness Commands - Should trigger appropriate tools"""
        print("🔍 Test 4: Fitness Commands")
        
        fitness_commands = [
            "אני רוצה לרשום 20 סקוואטים",  # I want to log 20 squats
            "כמה נקודות יש לי?",  # How many points do I have?
            "תציע לי אימון",  # Suggest me a workout
            "I did 30 pushups"
        ]
        
        for command in fitness_commands:
            result = self.send_chat_message(command)
            if result["success"]:
                data = result["data"]
                response = data.get("response", "")
                tool_executed = data.get("tool_executed", False)
                
                # Check for fitness-related content in response
                fitness_content = any(word in response.lower() for word in [
                    "סקווט", "שכיבות", "אימון", "נקודות", "תרגיל",
                    "squat", "pushup", "workout", "points", "exercise"
                ])
                
                if fitness_content:
                    self.log_test(
                        f"Fitness Command: {command}",
                        "PASS",
                        "Responded appropriately to fitness command"
                    )
                else:
                    self.log_test(
                        f"Fitness Command: {command}",
                        "FAIL",
                        "No fitness-related response to fitness command",
                        "Fitness-related response",
                        f"Response: {response[:100]}..."
                    )
    
    def test_conversation_memory(self):
        """Test 5: Conversation Memory - Verify context retention"""
        print("🔍 Test 5: Conversation Memory")
        
        # First message: introduce name
        user_id = "memory-test-user"
        intro_result = self.send_chat_message("שלום, קוראים לי דוד", user_id)
        
        if not intro_result["success"]:
            self.log_test(
                "Conversation Memory - Setup",
                "FAIL",
                f"Failed to send introduction: {intro_result.get('error')}"
            )
            return
        
        time.sleep(1)  # Small delay between messages
        
        # Second message: ask for name
        name_result = self.send_chat_message("מה השם שלי?", user_id)
        
        if name_result["success"]:
            response = name_result["data"].get("response", "").lower()
            
            # Check if response contains the name "דוד" (David)
            if "דוד" in response or "david" in response:
                self.log_test(
                    "Conversation Memory",
                    "PASS",
                    "Successfully remembered name from previous message"
                )
            else:
                self.log_test(
                    "Conversation Memory",
                    "FAIL",
                    "Did not remember name from previous message",
                    "Response should contain 'דוד' or 'David'",
                    f"Response: {response}"
                )
        else:
            self.log_test(
                "Conversation Memory - Query",
                "FAIL", 
                f"Failed to ask for name: {name_result.get('error')}"
            )
    
    def test_tool_system_integration(self):
        """Test 6: Tool System Integration - Verify tools are available and working"""
        print("🔍 Test 6: Tool System Integration")
        
        # Test specific tool triggers
        tool_tests = [
            {
                "message": "רשום לי 15 סקוואטים",  # Log 15 squats for me
                "expected_tool": "exerciseLogger",
                "expected_content": ["סקווט", "15", "רשמתי"]
            },
            {
                "message": "תראה לי את הסטטיסטיקות שלי",  # Show me my statistics
                "expected_tool": "statsRetriever", 
                "expected_content": ["נקודות", "סטטיסטיקות", "אימון"]
            }
        ]
        
        for test in tool_tests:
            result = self.send_chat_message(test["message"])
            if result["success"]:
                response = result["data"].get("response", "")
                
                # Check if expected content appears in response
                content_found = any(word in response for word in test["expected_content"])
                
                if content_found:
                    self.log_test(
                        f"Tool System - {test['expected_tool']}",
                        "PASS",
                        f"Tool appeared to execute correctly"
                    )
                else:
                    self.log_test(
                        f"Tool System - {test['expected_tool']}",
                        "FAIL",
                        "Expected tool content not found in response",
                        f"Should contain: {test['expected_content']}",
                        f"Response: {response[:100]}..."
                    )
    
    def run_all_tests(self):
        """Run complete test suite"""
        print("🚀 Starting SweatBot Frontend Test Suite")
        print("="*60)
        
        # Health checks first
        if not self.check_backend_health():
            print("❌ Backend health check failed - aborting tests")
            return False
        
        if not self.check_frontend_health():
            print("❌ Frontend health check failed - continuing with backend tests only")
        
        print("\n" + "="*60)
        
        # Run all tests
        self.test_natural_greetings_variation()
        self.test_no_automatic_ui_components()
        self.test_non_fitness_questions()
        self.test_fitness_commands()
        self.test_conversation_memory()
        self.test_tool_system_integration()
        
        # Summary
        print("\n" + "="*60)
        print("📊 TEST SUMMARY")
        print("="*60)
        
        passed = sum(1 for result in self.test_results if result["status"] == "PASS")
        failed = sum(1 for result in self.test_results if result["status"] == "FAIL")
        partial = sum(1 for result in self.test_results if result["status"] == "PARTIAL")
        
        print(f"✅ PASSED: {passed}")
        print(f"❌ FAILED: {failed}")
        print(f"⚠️  PARTIAL: {partial}")
        print(f"📝 TOTAL: {len(self.test_results)}")
        
        success_rate = (passed / len(self.test_results)) * 100 if self.test_results else 0
        print(f"🎯 SUCCESS RATE: {success_rate:.1f}%")
        
        return success_rate >= 70  # 70% pass rate for success


if __name__ == "__main__":
    tester = SweatBotTester()
    success = tester.run_all_tests()
    
    # Export detailed results to JSON
    results_file = "/mnt/d/MY PROJECTS/AI/LLM/AI Code Gen/my-builds/Automation-Bots/sweatbot/test_results.json"
    with open(results_file, 'w', encoding='utf-8') as f:
        json.dump(tester.test_results, f, indent=2, ensure_ascii=False)
    
    print(f"\n📄 Detailed results saved to: {results_file}")
    
    sys.exit(0 if success else 1)