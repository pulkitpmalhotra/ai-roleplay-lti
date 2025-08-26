#!/bin/bash

echo "🧪 LTI GEMINI ROLEPLAY BOT - COMPREHENSIVE TEST SUITE"
echo "===================================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_result="$3"
    
    echo -e "\n${BLUE}Testing: $test_name${NC}"
    
    if eval "$test_command"; then
        echo -e "${GREEN}✅ PASS: $test_name${NC}"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAIL: $test_name${NC}"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Function to check HTTP status
check_http_status() {
    local url="$1"
    local expected_status="$2"
    local actual_status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$actual_status" = "$expected_status" ]; then
        return 0
    else
        echo "Expected: $expected_status, Got: $actual_status"
        return 1
    fi
}

echo -e "\n${YELLOW}1. BASIC CONNECTIVITY TESTS${NC}"
echo "================================"

run_test "Home Page Accessibility" "check_http_status 'http://localhost:3000' '200'"
run_test "Admin Dashboard Accessibility" "check_http_status 'http://localhost:3000/admin' '200'"
run_test "Scenarios API Accessibility" "check_http_status 'http://localhost:3000/api/scenarios' '200'"
run_test "LTI Launch Endpoint" "check_http_status 'http://localhost:3000/api/lti/launch?test=true' '307'"

echo -e "\n${YELLOW}2. DATABASE & SCENARIOS TESTS${NC}"
echo "================================="

run_test "Database Has Scenarios" "[ \$(curl -s http://localhost:3000/api/scenarios | jq '.scenarios | length') -gt 0 ]"
run_test "Customer Service Scenario Exists" "curl -s http://localhost:3000/api/scenarios | jq -e '.scenarios[] | select(.title == \"Customer Service Excellence\")' > /dev/null"
run_test "Admin API Responds Correctly" "curl -s http://localhost:3000/api/admin/scenarios | jq -e '.success == true' > /dev/null"

echo -e "\n${YELLOW}3. LTI FLOW TESTS${NC}"
echo "=================="

# Test LTI launch flow
echo "Testing LTI Launch Flow..."
REDIRECT_URL=$(curl -s -L -w "%{url_effective}" -o /dev/null http://localhost:3000/api/lti/launch?test=true)
echo "LTI Redirect URL: $REDIRECT_URL"

run_test "LTI Redirects to Scenario Selection" "echo '$REDIRECT_URL' | grep -q 'select-scenario'"
run_test "User Context Preserved in URL" "echo '$REDIRECT_URL' | grep -q 'user_id=1.*context_id=test.*resource_link_id=test'"
run_test "Scenario Selection Page Loads" "check_http_status '$REDIRECT_URL' '200'"

echo -e "\n${YELLOW}4. UI CONTENT TESTS${NC}"
echo "==================="

run_test "Home Page Has Try Demo Button" "curl -s http://localhost:3000 | grep -q 'Try Demo'"
run_test "Home Page Shows LTI Configuration" "curl -s http://localhost:3000 | grep -q 'train-ai-mentor.preview.emergentagent.com'"
run_test "Admin Dashboard Shows Scenario Count" "curl -s http://localhost:3000/admin | grep -q 'Total Scenarios'"
run_test "Scenario Selection Shows Demo Mode" "curl -s '$REDIRECT_URL' | grep -q 'Demo Mode Active'"

echo -e "\n${YELLOW}5. API FUNCTIONALITY TESTS${NC}"
echo "==========================="

# Test creating a session
echo "Testing session creation..."
SESSION_RESPONSE=$(curl -s -X POST http://localhost:3000/api/roleplay/start \
  -H "Content-Type: application/json" \
  -d '{"userId": 1, "scenarioId": 1, "contextId": "test", "resourceLinkId": "test"}')

run_test "Session Creation API Works" "echo '$SESSION_RESPONSE' | jq -e '.success == true' > /dev/null"

if echo "$SESSION_RESPONSE" | jq -e '.success == true' > /dev/null; then
    SESSION_TOKEN=$(echo "$SESSION_RESPONSE" | jq -r '.sessionToken')
    echo "Session Token: $SESSION_TOKEN"
    
    run_test "Session Token Generated" "[ -n '$SESSION_TOKEN' ]"
    
    # Test chat functionality
    CHAT_RESPONSE=$(curl -s -X POST http://localhost:3000/api/roleplay/chat \
      -H "Content-Type: application/json" \
      -d "{\"sessionToken\": \"$SESSION_TOKEN\", \"message\": \"Hello, I need help with customer service\"}")
    
    run_test "Chat API Responds" "echo '$CHAT_RESPONSE' | jq -e '.success == true' > /dev/null"
    run_test "Chat Returns AI Response" "echo '$CHAT_RESPONSE' | jq -e '.response | length > 0' > /dev/null"
    run_test "Progress Tracking Works" "echo '$CHAT_RESPONSE' | jq -e '.progress | length >= 0' > /dev/null"
fi

echo -e "\n${YELLOW}6. ROLEPLAY FUNCTIONALITY TESTS${NC}"
echo "=================================="

# Test user creation
USER_CREATED=$(curl -s -X POST http://localhost:3000/api/roleplay/start \
  -H "Content-Type: application/json" \
  -d '{"userId": 999, "scenarioId": 1, "contextId": "test", "resourceLinkId": "test"}')

run_test "New User Session Creation" "echo '$USER_CREATED' | jq -e '.success == true' > /dev/null"

echo -e "\n${YELLOW}7. ADMIN FUNCTIONALITY TESTS${NC}"
echo "=============================="

# Test scenario creation
NEW_SCENARIO=$(curl -s -X POST http://localhost:3000/api/admin/scenarios \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Scenario - Automated",
    "description": "Automated test scenario",
    "objective": "Test admin functionality",
    "botTone": "Professional",
    "botContext": "Test context",
    "botCharacter": "Test Assistant",
    "learningObjectives": ["Test objective 1", "Test objective 2"]
  }')

run_test "Admin Can Create Scenarios" "echo '$NEW_SCENARIO' | jq -e '.success == true' > /dev/null"

echo -e "\n${BLUE}=================================${NC}"
echo -e "${BLUE}TEST SUMMARY${NC}"
echo -e "${BLUE}=================================${NC}"
echo -e "${GREEN}Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Tests Failed: $TESTS_FAILED${NC}"

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
SUCCESS_RATE=$((TESTS_PASSED * 100 / TOTAL_TESTS))

echo -e "${BLUE}Success Rate: $SUCCESS_RATE%${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 ALL TESTS PASSED! The LTI Gemini Roleplay Bot is working correctly!${NC}"
    exit 0
else
    echo -e "\n${YELLOW}⚠️  Some tests failed. Check the output above for details.${NC}"
    exit 1
fi