#!/bin/bash

#############################################################################
# Rush Policy Chat - Azure Deployment Verification Script
#
# This script validates the Azure Web Apps deployment by checking:
# - Web app health and status
# - Managed Identity configuration
# - Azure AI permissions
# - Application logs for errors
# - HTTP endpoint accessibility
#
# Usage:
#   ./scripts/verify-deployment.sh [APP_NAME] [RESOURCE_GROUP]
#
# Examples:
#   ./scripts/verify-deployment.sh
#   ./scripts/verify-deployment.sh rush-policy-chat rg-rush-policy-chat-prod
#############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Default values
APP_NAME="${1:-rush-policy-chat}"
RESOURCE_GROUP="${2:-rg-rush-policy-chat-prod}"

# Helper functions
print_header() {
    echo ""
    echo -e "${BLUE}============================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}============================================${NC}"
    echo ""
}

print_check() {
    echo -n "Checking $1... "
}

print_pass() {
    echo -e "${GREEN}✅ PASS${NC}"
}

print_fail() {
    echo -e "${RED}❌ FAIL${NC}"
    if [ -n "$1" ]; then
        echo -e "${RED}   $1${NC}"
    fi
}

print_warning() {
    echo -e "${YELLOW}⚠️  WARNING${NC}"
    if [ -n "$1" ]; then
        echo -e "${YELLOW}   $1${NC}"
    fi
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Track overall status
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_WARNING=0

# Start verification
print_header "Azure Web Apps Deployment Verification"
print_info "App Name: $APP_NAME"
print_info "Resource Group: $RESOURCE_GROUP"

# Check 1: Azure CLI authentication
print_header "1. Azure CLI Authentication"
print_check "Azure CLI login status"

if az account show &> /dev/null; then
    ACCOUNT_NAME=$(az account show --query name -o tsv)
    print_pass
    print_info "Logged in as: $ACCOUNT_NAME"
    ((TESTS_PASSED++))
else
    print_fail "Not logged in to Azure"
    print_info "Run: az login"
    ((TESTS_FAILED++))
    exit 1
fi

# Check 2: Web App Exists
print_header "2. Web App Configuration"
print_check "Web app exists"

if az webapp show --name $APP_NAME --resource-group $RESOURCE_GROUP &> /dev/null; then
    print_pass
    ((TESTS_PASSED++))
else
    print_fail "Web app not found"
    ((TESTS_FAILED++))
    exit 1
fi

# Check 3: Web App State
print_check "Web app state"

STATE=$(az webapp show --name $APP_NAME --resource-group $RESOURCE_GROUP --query state -o tsv)
if [ "$STATE" == "Running" ]; then
    print_pass
    ((TESTS_PASSED++))
else
    print_fail "Web app state: $STATE (expected: Running)"
    ((TESTS_FAILED++))
fi

# Check 4: Runtime Configuration
print_check "Node.js runtime"

RUNTIME=$(az webapp show --name $APP_NAME --resource-group $RESOURCE_GROUP --query siteConfig.linuxFxVersion -o tsv)
if [[ "$RUNTIME" == *"NODE"* ]]; then
    print_pass
    print_info "Runtime: $RUNTIME"
    ((TESTS_PASSED++))
else
    print_fail "Invalid runtime: $RUNTIME"
    ((TESTS_FAILED++))
fi

# Check 5: HTTPS Configuration
print_check "HTTPS-only mode"

HTTPS_ONLY=$(az webapp show --name $APP_NAME --resource-group $RESOURCE_GROUP --query httpsOnly -o tsv)
if [ "$HTTPS_ONLY" == "true" ]; then
    print_pass
    ((TESTS_PASSED++))
else
    print_warning "HTTPS-only not enabled (recommended for production)"
    ((TESTS_WARNING++))
fi

# Check 6: Managed Identity
print_header "3. Managed Identity"
print_check "System-assigned managed identity"

PRINCIPAL_ID=$(az webapp show --name $APP_NAME --resource-group $RESOURCE_GROUP --query identity.principalId -o tsv)
if [ -n "$PRINCIPAL_ID" ] && [ "$PRINCIPAL_ID" != "null" ]; then
    print_pass
    print_info "Principal ID: $PRINCIPAL_ID"
    ((TESTS_PASSED++))
else
    print_fail "Managed identity not enabled"
    print_info "Run: az webapp identity assign --name $APP_NAME --resource-group $RESOURCE_GROUP"
    ((TESTS_FAILED++))
fi

# Check 7: Role Assignments (if Managed Identity exists)
if [ -n "$PRINCIPAL_ID" ] && [ "$PRINCIPAL_ID" != "null" ]; then
    print_check "Azure AI role assignments"

    ROLE_COUNT=$(az role assignment list --assignee $PRINCIPAL_ID --query "length([?roleDefinitionName=='Cognitive Services User'])" -o tsv)
    if [ "$ROLE_COUNT" -gt 0 ]; then
        print_pass
        print_info "Found $ROLE_COUNT Cognitive Services User role assignment(s)"
        ((TESTS_PASSED++))
    else
        print_warning "No Cognitive Services User role assignments found"
        print_info "This may cause authentication errors with Azure AI"
        ((TESTS_WARNING++))
    fi
fi

# Check 8: Application Settings
print_header "4. Application Settings"
print_check "Required environment variables"

APP_SETTINGS=$(az webapp config appsettings list --name $APP_NAME --resource-group $RESOURCE_GROUP -o json)

REQUIRED_VARS=("AZURE_AI_ENDPOINT" "AZURE_AI_AGENT_ID" "NODE_ENV")
MISSING_VARS=()

for VAR in "${REQUIRED_VARS[@]}"; do
    if echo "$APP_SETTINGS" | grep -q "\"name\": \"$VAR\""; then
        echo -e "  ${GREEN}✓${NC} $VAR is set"
    else
        echo -e "  ${RED}✗${NC} $VAR is missing"
        MISSING_VARS+=("$VAR")
    fi
done

if [ ${#MISSING_VARS[@]} -eq 0 ]; then
    print_pass
    ((TESTS_PASSED++))
else
    print_fail "Missing variables: ${MISSING_VARS[*]}"
    ((TESTS_FAILED++))
fi

# Check 9: Deployment Status
print_header "5. Deployment Status"
print_check "Latest deployment"

DEPLOYMENT_STATUS=$(az webapp deployment list --name $APP_NAME --resource-group $RESOURCE_GROUP --query "[0].status" -o tsv 2>/dev/null || echo "Unknown")

if [ "$DEPLOYMENT_STATUS" == "Success" ] || [ "$DEPLOYMENT_STATUS" == "4" ]; then
    print_pass
    ((TESTS_PASSED++))
elif [ "$DEPLOYMENT_STATUS" == "Unknown" ]; then
    print_warning "No deployment history found"
    ((TESTS_WARNING++))
else
    print_fail "Deployment status: $DEPLOYMENT_STATUS"
    ((TESTS_FAILED++))
fi

# Check 10: HTTP Endpoint
print_header "6. HTTP Endpoint Accessibility"

APP_URL=$(az webapp show --name $APP_NAME --resource-group $RESOURCE_GROUP --query defaultHostName -o tsv)
print_info "Testing URL: https://$APP_URL"

print_check "HTTP GET request to homepage"

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -L "https://$APP_URL" --max-time 30 || echo "000")

if [ "$HTTP_STATUS" == "200" ]; then
    print_pass
    print_info "Homepage is accessible"
    ((TESTS_PASSED++))
elif [ "$HTTP_STATUS" == "000" ]; then
    print_fail "Connection timeout or network error"
    ((TESTS_FAILED++))
else
    print_fail "HTTP $HTTP_STATUS (expected 200)"
    ((TESTS_FAILED++))
fi

# Check 11: API Endpoint Test
print_check "Azure AI Agent API endpoint"

API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -L \
    -X POST "https://$APP_URL/api/azure-agent" \
    -H "Content-Type: application/json" \
    -d '{"message":"health check","resetConversation":true}' \
    --max-time 60 || echo "000")

if [ "$API_STATUS" == "200" ]; then
    print_pass
    print_info "API endpoint is responding correctly"
    ((TESTS_PASSED++))
elif [ "$API_STATUS" == "400" ] || [ "$API_STATUS" == "500" ]; then
    print_warning "API returned HTTP $API_STATUS (may need further investigation)"
    ((TESTS_WARNING++))
else
    print_fail "API endpoint test failed with HTTP $API_STATUS"
    ((TESTS_FAILED++))
fi

# Check 12: Application Logs
print_header "7. Application Logs"
print_info "Fetching recent logs (last 100 lines)..."

az webapp log download \
    --name $APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --log-file /tmp/azure-logs-$APP_NAME.zip &>/dev/null || true

print_check "Error detection in logs"

# Get live logs for the last few seconds
LOGS=$(az webapp log tail --name $APP_NAME --resource-group $RESOURCE_GROUP --timeout 5 2>/dev/null || echo "")

if echo "$LOGS" | grep -qi "error\|exception\|failed\|cannot"; then
    print_warning "Errors detected in logs (see details below)"
    ((TESTS_WARNING++))
    echo ""
    echo -e "${YELLOW}Recent Errors:${NC}"
    echo "$LOGS" | grep -i "error\|exception\|failed\|cannot" | tail -n 5
else
    print_pass
    print_info "No obvious errors in recent logs"
    ((TESTS_PASSED++))
fi

# Summary
print_header "Verification Summary"

echo -e "${GREEN}✅ Passed:   $TESTS_PASSED${NC}"
echo -e "${YELLOW}⚠️  Warnings: $TESTS_WARNING${NC}"
echo -e "${RED}❌ Failed:   $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All critical tests passed!${NC}"
    echo ""
    echo -e "${BLUE}Your app is accessible at: https://$APP_URL${NC}"
    echo ""
    print_info "Next Steps:"
    echo "  1. Test the application in a browser"
    echo "  2. Ask a policy question"
    echo "  3. Monitor logs: az webapp log tail --name $APP_NAME --resource-group $RESOURCE_GROUP"
    echo "  4. View metrics in Azure Portal"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please review the errors above.${NC}"
    echo ""
    print_info "Troubleshooting:"
    echo "  1. Check logs: az webapp log tail --name $APP_NAME --resource-group $RESOURCE_GROUP"
    echo "  2. Review configuration in Azure Portal"
    echo "  3. Restart the app: az webapp restart --name $APP_NAME --resource-group $RESOURCE_GROUP"
    echo "  4. Verify Managed Identity permissions"
    exit 1
fi
