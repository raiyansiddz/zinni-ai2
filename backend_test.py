#!/usr/bin/env python3
"""
Backend API Testing Script for Glass AI Assistant
Tests FastAPI backend with Stack Auth and PostgreSQL integration
"""

import requests
import json
import sys
from typing import Dict, Any, Optional

# Base URL for the API
BASE_URL = "http://localhost:8001"

class BackendTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.test_results = []
        self.failed_tests = []
        
    def log_test(self, test_name: str, success: bool, details: str, response_data: Any = None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "response_data": response_data
        }
        self.test_results.append(result)
        
        if not success:
            self.failed_tests.append(result)
            
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {details}")
        
    def make_request(self, method: str, endpoint: str, headers: Optional[Dict] = None, 
                    data: Optional[Dict] = None, json_data: Optional[Dict] = None) -> requests.Response:
        """Make HTTP request with error handling"""
        url = f"{self.base_url}{endpoint}"
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=headers, timeout=10)
            elif method.upper() == "POST":
                response = requests.post(url, headers=headers, data=data, json=json_data, timeout=10)
            elif method.upper() == "PUT":
                response = requests.put(url, headers=headers, data=data, json=json_data, timeout=10)
            elif method.upper() == "DELETE":
                response = requests.delete(url, headers=headers, timeout=10)
            else:
                raise ValueError(f"Unsupported method: {method}")
            return response
        except requests.exceptions.RequestException as e:
            print(f"Request failed for {endpoint}: {e}")
            raise

    def test_basic_health_checks(self):
        """Test basic health check endpoints"""
        print("\n=== Testing Basic Health Checks ===")
        
        # Test root endpoint
        try:
            response = self.make_request("GET", "/")
            expected_response = {"message": "Glass AI Assistant API", "version": "1.0.0"}
            
            if response.status_code == 200:
                response_json = response.json()
                if response_json == expected_response:
                    self.log_test("Root Endpoint", True, "Returned correct response", response_json)
                else:
                    self.log_test("Root Endpoint", False, f"Unexpected response: {response_json}", response_json)
            else:
                self.log_test("Root Endpoint", False, f"Status code: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Root Endpoint", False, f"Exception: {str(e)}")
            
        # Test health endpoint
        try:
            response = self.make_request("GET", "/health")
            expected_response = {"status": "healthy"}
            
            if response.status_code == 200:
                response_json = response.json()
                if response_json == expected_response:
                    self.log_test("Health Endpoint", True, "Returned correct response", response_json)
                else:
                    self.log_test("Health Endpoint", False, f"Unexpected response: {response_json}", response_json)
            else:
                self.log_test("Health Endpoint", False, f"Status code: {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Health Endpoint", False, f"Exception: {str(e)}")

    def test_plan_management(self):
        """Test plan management endpoints"""
        print("\n=== Testing Plan Management ===")
        
        # Test public plans endpoint
        try:
            response = self.make_request("GET", "/api/plan/")
            
            if response.status_code == 200:
                plans = response.json()
                
                # Check if we have 4 plans
                if len(plans) == 4:
                    self.log_test("Plans Count", True, f"Found {len(plans)} plans as expected", len(plans))
                else:
                    self.log_test("Plans Count", False, f"Expected 4 plans, got {len(plans)}", len(plans))
                
                # Check plan structure and expected plans
                expected_plan_types = ["free", "basic", "pro", "enterprise"]
                expected_prices = {"free": 0, "basic": 999, "pro": 1999, "enterprise": 4999}  # in cents
                
                found_plan_types = []
                valid_structure = True
                
                for plan in plans:
                    # Check required fields
                    required_fields = ["id", "name", "plan_type", "price_monthly", "price_yearly", 
                                     "ask_limit_monthly", "session_limit_monthly", "features", "is_active"]
                    
                    for field in required_fields:
                        if field not in plan:
                            valid_structure = False
                            self.log_test("Plan Structure", False, f"Missing field '{field}' in plan: {plan.get('name', 'Unknown')}")
                            break
                    
                    if valid_structure:
                        found_plan_types.append(plan["plan_type"])
                        
                        # Check if price matches expected
                        plan_type = plan["plan_type"]
                        if plan_type in expected_prices:
                            if plan["price_monthly"] == expected_prices[plan_type]:
                                self.log_test(f"Plan Price - {plan_type}", True, f"Correct price: ${plan['price_monthly']/100:.2f}")
                            else:
                                self.log_test(f"Plan Price - {plan_type}", False, 
                                            f"Expected ${expected_prices[plan_type]/100:.2f}, got ${plan['price_monthly']/100:.2f}")
                
                if valid_structure:
                    self.log_test("Plan Structure", True, "All plans have required fields")
                
                # Check if all expected plan types are present
                missing_plans = set(expected_plan_types) - set(found_plan_types)
                if not missing_plans:
                    self.log_test("Plan Types", True, "All expected plan types found", found_plan_types)
                else:
                    self.log_test("Plan Types", False, f"Missing plan types: {missing_plans}", found_plan_types)
                    
            else:
                self.log_test("Plans Endpoint", False, f"Status code: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Plans Endpoint", False, f"Exception: {str(e)}")

        # Test protected plan endpoints (should return 403)
        protected_plan_endpoints = [
            ("/api/plan/current", "GET", "Current Plan"),
            ("/api/plan/usage", "GET", "Plan Usage")
        ]
        
        for endpoint, method, name in protected_plan_endpoints:
            try:
                response = self.make_request(method, endpoint)
                if response.status_code == 403:
                    self.log_test(f"{name} (No Auth)", True, "Correctly returned 403 for missing token")
                else:
                    self.log_test(f"{name} (No Auth)", False, f"Expected 403, got {response.status_code}", response.text)
            except Exception as e:
                self.log_test(f"{name} (No Auth)", False, f"Exception: {str(e)}")

    def test_ai_endpoints(self):
        """Test AI-related endpoints"""
        print("\n=== Testing AI Endpoints ===")
        
        # Test public AI providers endpoint
        try:
            response = self.make_request("GET", "/api/ask/providers")
            
            if response.status_code == 200:
                response_json = response.json()
                
                # Check response structure
                if (response_json.get("success") == True and 
                    response_json.get("message") == "Available AI providers" and
                    "data" in response_json and
                    "providers" in response_json["data"]):
                    
                    providers = response_json["data"]["providers"]
                    if "gemini" in providers:
                        self.log_test("AI Providers", True, f"Correct response with providers: {providers}", response_json)
                    else:
                        self.log_test("AI Providers", False, f"Gemini not found in providers: {providers}", response_json)
                else:
                    self.log_test("AI Providers", False, f"Unexpected response structure: {response_json}", response_json)
            else:
                self.log_test("AI Providers", False, f"Status code: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("AI Providers", False, f"Exception: {str(e)}")

        # Test protected AI endpoints (should return 403)
        protected_ai_endpoints = [
            ("/api/ask/", "POST", "AI Ask"),
            ("/api/ask/messages?session_id=test", "GET", "AI Messages")
        ]
        
        for endpoint, method, name in protected_ai_endpoints:
            try:
                json_data = {"prompt": "test"} if method == "POST" else None
                response = self.make_request(method, endpoint, json_data=json_data)
                if response.status_code == 403:
                    self.log_test(f"{name} (No Auth)", True, "Correctly returned 403 for missing token")
                else:
                    self.log_test(f"{name} (No Auth)", False, f"Expected 403, got {response.status_code}", response.text)
            except Exception as e:
                self.log_test(f"{name} (No Auth)", False, f"Exception: {str(e)}")

    def test_authentication_endpoints(self):
        """Test authentication endpoints"""
        print("\n=== Testing Authentication Endpoints ===")
        
        # Test auth status (no token required)
        try:
            response = self.make_request("GET", "/api/auth/status")
            
            if response.status_code == 200:
                response_json = response.json()
                
                # Should return success=True and authenticated=False when no token
                if (response_json.get("success") == True and 
                    response_json.get("data", {}).get("authenticated") == False):
                    self.log_test("Auth Status (No Token)", True, "Correctly returned unauthenticated status", response_json)
                else:
                    self.log_test("Auth Status (No Token)", False, f"Unexpected response: {response_json}", response_json)
            else:
                self.log_test("Auth Status (No Token)", False, f"Status code: {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Auth Status (No Token)", False, f"Exception: {str(e)}")
        
        # Test protected auth endpoints (should return 403)
        protected_auth_endpoints = [
            ("/api/auth/verify", "POST", "Auth Verify"),
            ("/api/auth/me", "GET", "Auth Me")
        ]
        
        for endpoint, method, name in protected_auth_endpoints:
            try:
                response = self.make_request(method, endpoint)
                if response.status_code == 403:
                    self.log_test(f"{name} (No Token)", True, "Correctly returned 403 for missing token")
                else:
                    self.log_test(f"{name} (No Token)", False, f"Expected 403, got {response.status_code}", response.text)
            except Exception as e:
                self.log_test(f"{name} (No Token)", False, f"Exception: {str(e)}")

    def test_user_management_endpoints(self):
        """Test user management endpoints"""
        print("\n=== Testing User Management Endpoints ===")
        
        # All user endpoints require authentication
        protected_user_endpoints = [
            ("/api/user/profile", "GET", "Get User Profile"),
            ("/api/user/profile", "PUT", "Update User Profile"),
            ("/api/user/profile", "DELETE", "Delete User Profile")
        ]
        
        for endpoint, method, name in protected_user_endpoints:
            try:
                json_data = {"display_name": "test"} if method == "PUT" else None
                response = self.make_request(method, endpoint, json_data=json_data)
                if response.status_code == 403:
                    self.log_test(f"{name} (No Auth)", True, "Correctly returned 403 for missing token")
                else:
                    self.log_test(f"{name} (No Auth)", False, f"Expected 403, got {response.status_code}", response.text)
            except Exception as e:
                self.log_test(f"{name} (No Auth)", False, f"Exception: {str(e)}")

    def test_usage_tracking_endpoints(self):
        """Test usage tracking endpoints"""
        print("\n=== Testing Usage Tracking Endpoints ===")
        
        # All tracking endpoints require authentication
        protected_tracking_endpoints = [
            ("/api/track/", "POST", "Track Usage"),
            ("/api/track/sessions", "GET", "Get Sessions")
        ]
        
        for endpoint, method, name in protected_tracking_endpoints:
            try:
                json_data = {"action_type": "test", "resource_used": "test", "quantity": 1} if method == "POST" else None
                response = self.make_request(method, endpoint, json_data=json_data)
                if response.status_code == 403:
                    self.log_test(f"{name} (No Auth)", True, "Correctly returned 403 for missing token")
                else:
                    self.log_test(f"{name} (No Auth)", False, f"Expected 403, got {response.status_code}", response.text)
            except Exception as e:
                self.log_test(f"{name} (No Auth)", False, f"Exception: {str(e)}")

    def test_admin_endpoints(self):
        """Test admin endpoints"""
        print("\n=== Testing Admin Endpoints ===")
        
        # All admin endpoints require authentication and admin role
        protected_admin_endpoints = [
            ("/api/admin/users", "GET", "Admin Get Users"),
            ("/api/admin/plans", "POST", "Admin Create Plan"),
            ("/api/admin/api-keys", "GET", "Admin Get API Keys"),
            ("/api/admin/stats", "GET", "Admin Get Stats")
        ]
        
        for endpoint, method, name in protected_admin_endpoints:
            try:
                json_data = {"name": "test", "plan_type": "test", "price_monthly": 100, "price_yearly": 1000} if method == "POST" else None
                response = self.make_request(method, endpoint, json_data=json_data)
                if response.status_code == 403:
                    self.log_test(f"{name} (No Auth)", True, "Correctly returned 403 for missing token")
                else:
                    self.log_test(f"{name} (No Auth)", False, f"Expected 403, got {response.status_code}", response.text)
            except Exception as e:
                self.log_test(f"{name} (No Auth)", False, f"Exception: {str(e)}")

    def test_stripe_endpoints(self):
        """Test Stripe integration endpoints"""
        print("\n=== Testing Stripe Integration Endpoints ===")
        
        # Test checkout session creation (requires auth)
        try:
            json_data = {
                "plan_type": "basic",
                "billing_period": "monthly",
                "success_url": "http://localhost:3000/success",
                "cancel_url": "http://localhost:3000/cancel"
            }
            response = self.make_request("POST", "/api/checkout/create-session", json_data=json_data)
            if response.status_code == 403:
                self.log_test("Stripe Checkout (No Auth)", True, "Correctly returned 403 for missing token")
            else:
                self.log_test("Stripe Checkout (No Auth)", False, f"Expected 403, got {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Stripe Checkout (No Auth)", False, f"Exception: {str(e)}")

        # Test webhook endpoint (should accept POST but fail without proper signature)
        try:
            response = self.make_request("POST", "/api/checkout/webhook", json_data={"test": "data"})
            # Webhook should return 400 for missing signature, not 403
            if response.status_code == 400:
                self.log_test("Stripe Webhook", True, "Correctly returned 400 for missing signature")
            else:
                self.log_test("Stripe Webhook", False, f"Expected 400, got {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Stripe Webhook", False, f"Exception: {str(e)}")

    def test_error_handling(self):
        """Test error handling for invalid endpoints and malformed requests"""
        print("\n=== Testing Error Handling ===")
        
        # Test invalid endpoint (should return 404)
        try:
            response = self.make_request("GET", "/api/nonexistent")
            
            if response.status_code == 404:
                self.log_test("Invalid Endpoint", True, "Correctly returned 404 for invalid endpoint")
            else:
                self.log_test("Invalid Endpoint", False, f"Expected 404, got {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Invalid Endpoint", False, f"Exception: {str(e)}")
        
        # Test malformed POST request to auth verify
        try:
            headers = {"Content-Type": "application/json"}
            response = self.make_request("POST", "/api/auth/verify", headers=headers, json_data={"invalid": "data"})
            
            # Should still return 403 for missing auth, not a validation error
            if response.status_code == 403:
                self.log_test("Malformed Auth Request", True, "Correctly handled malformed request with 403")
            else:
                self.log_test("Malformed Auth Request", False, f"Expected 403, got {response.status_code}", response.text)
                
        except Exception as e:
            self.log_test("Malformed Auth Request", False, f"Exception: {str(e)}")

    def test_database_connectivity(self):
        """Test database connectivity through API responses"""
        print("\n=== Testing Database Connectivity ===")
        
        # The plans endpoint requires database access, so if it works, DB is connected
        try:
            response = self.make_request("GET", "/api/plan/")
            
            if response.status_code == 200:
                plans = response.json()
                if len(plans) > 0:
                    self.log_test("Database Connectivity", True, f"Database accessible - retrieved {len(plans)} plans")
                else:
                    self.log_test("Database Connectivity", False, "Database accessible but no plans found")
            else:
                self.log_test("Database Connectivity", False, f"Database may be inaccessible - status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Database Connectivity", False, f"Database connection failed: {str(e)}")

    def test_stack_auth_integration(self):
        """Test Stack Auth integration"""
        print("\n=== Testing Stack Auth Integration ===")
        
        # Test that Stack Auth configuration is working by checking auth status endpoint
        try:
            response = self.make_request("GET", "/api/auth/status")
            
            if response.status_code == 200:
                response_json = response.json()
                
                # Check that the response has the expected Stack Auth structure
                if (response_json.get("success") == True and 
                    "data" in response_json and
                    "authenticated" in response_json["data"]):
                    self.log_test("Stack Auth Integration", True, "Stack Auth service responding correctly")
                else:
                    self.log_test("Stack Auth Integration", False, f"Unexpected auth status response: {response_json}")
            else:
                self.log_test("Stack Auth Integration", False, f"Auth status endpoint failed: {response.status_code}")
                
        except Exception as e:
            self.log_test("Stack Auth Integration", False, f"Stack Auth integration error: {str(e)}")

    def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting Glass AI Assistant Backend API Tests")
        print(f"Testing backend at: {self.base_url}")
        print("📋 Testing Stack Auth + PostgreSQL Migration")
        
        # Run all test suites
        self.test_basic_health_checks()
        self.test_plan_management()
        self.test_ai_endpoints()
        self.test_authentication_endpoints()
        self.test_user_management_endpoints()
        self.test_usage_tracking_endpoints()
        self.test_admin_endpoints()
        self.test_stripe_endpoints()
        self.test_error_handling()
        self.test_database_connectivity()
        self.test_stack_auth_integration()
        
        # Print summary
        self.print_summary()
        
    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*60)
        print("📊 TEST SUMMARY")
        print("="*60)
        
        total_tests = len(self.test_results)
        passed_tests = total_tests - len(self.failed_tests)
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {len(self.failed_tests)}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if self.failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in self.failed_tests:
                print(f"  - {test['test']}: {test['details']}")
        else:
            print("\n🎉 ALL TESTS PASSED!")
            print("\n✅ MIGRATION VERIFICATION:")
            print("  - Stack Auth integration: Working")
            print("  - PostgreSQL database: Connected")
            print("  - All API endpoints: Responding correctly")
            print("  - Authentication flow: Properly secured")
            print("  - Error handling: Consistent JSON responses")
            
        print("\n" + "="*60)

if __name__ == "__main__":
    tester = BackendTester()
    tester.run_all_tests()
    
    # Exit with error code if tests failed
    if tester.failed_tests:
        sys.exit(1)
    else:
        sys.exit(0)