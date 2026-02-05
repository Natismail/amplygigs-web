#!/bin/bash
# test-cron-jobs.sh
# Manual test script for all Phase 2 cron jobs

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL=${1:-"http://localhost:3000"}
CRON_SECRET=${CRON_SECRET:-"your_cron_secret_here"}

echo -e "${BLUE}🧪 Testing Phase 2 Cron Jobs${NC}"
echo -e "${BLUE}Base URL: $BASE_URL${NC}"
echo ""

# Test 1: Auto-Release Escrow
echo -e "${BLUE}1️⃣ Testing Auto-Release Escrow...${NC}"
response=$(curl -s -X POST "$BASE_URL/api/cron/auto-release-escrow" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json")

if echo "$response" | grep -q '"success":true'; then
  echo -e "${GREEN}✅ Auto-Release Test PASSED${NC}"
  echo "$response" | jq '.'
else
  echo -e "${RED}❌ Auto-Release Test FAILED${NC}"
  echo "$response"
fi
echo ""

# Test 2: Process Withdrawals
echo -e "${BLUE}2️⃣ Testing Process Withdrawals...${NC}"
response=$(curl -s -X POST "$BASE_URL/api/cron/process-withdrawals" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json")

if echo "$response" | grep -q '"success":true'; then
  echo -e "${GREEN}✅ Withdrawals Test PASSED${NC}"
  echo "$response" | jq '.'
else
  echo -e "${RED}❌ Withdrawals Test FAILED${NC}"
  echo "$response"
fi
echo ""

# Test 3: Cleanup Notifications
echo -e "${BLUE}3️⃣ Testing Cleanup Notifications...${NC}"
response=$(curl -s -X POST "$BASE_URL/api/cron/cleanup-notifications" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json")

if echo "$response" | grep -q '"success":true'; then
  echo -e "${GREEN}✅ Cleanup Test PASSED${NC}"
  echo "$response" | jq '.'
else
  echo -e "${RED}❌ Cleanup Test FAILED${NC}"
  echo "$response"
fi
echo ""

# Test 4: Check Compliance
echo -e "${BLUE}4️⃣ Testing Check Compliance...${NC}"
response=$(curl -s -X POST "$BASE_URL/api/cron/check-compliance" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json")

if echo "$response" | grep -q '"success":true'; then
  echo -e "${GREEN}✅ Compliance Test PASSED${NC}"
  echo "$response" | jq '.'
else
  echo -e "${RED}❌ Compliance Test FAILED${NC}"
  echo "$response"
fi
echo ""

echo -e "${BLUE}🎉 All tests completed!${NC}"

# Usage:
# chmod +x test-cron-jobs.sh
# ./test-cron-jobs.sh http://localhost:3000
# ./test-cron-jobs.sh https://your-app.vercel.app