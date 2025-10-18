#!/bin/bash

#############################################################################
# Rush Policy Chat - Azure Web Apps Deployment Script
#
# This script automates the complete deployment process to Azure Web Apps
# including resource creation, Managed Identity setup, and code deployment.
#
# Prerequisites:
# - Azure CLI installed and authenticated (az login)
# - Sufficient permissions in Azure subscription
# - Access to Azure AI resource
#
# Usage:
#   ./scripts/deploy-to-azure.sh [OPTIONS]
#
# Options:
#   --resource-group NAME    Resource group name (default: rg-rush-policy-chat-prod)
#   --app-name NAME          Web app name (default: rush-policy-chat)
#   --location LOCATION      Azure region (default: eastus)
#   --sku TIER               App Service plan SKU (default: B1)
#   --skip-build             Skip local build step
#   --help                   Show this help message
#############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
RESOURCE_GROUP="rg-rush-policy-chat-prod"
APP_NAME="rush-policy-chat"
LOCATION="eastus"
SKU="B1"
APP_SERVICE_PLAN="asp-rush-policy-chat"
SKIP_BUILD=false

# Azure AI configuration (from your existing setup)
AI_RESOURCE_GROUP="rua-nonprod-ai-innovation"
AI_RESOURCE_NAME="rua-nonprod-ai-innovation"
AI_ENDPOINT="https://rua-nonprod-ai-innovation.services.ai.azure.com/api/projects/rua-nonprod-ai-innovation-project"
AI_AGENT_ID="asst_301EhwakRXWsOCgGQt276WiU"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --resource-group)
      RESOURCE_GROUP="$2"
      shift 2
      ;;
    --app-name)
      APP_NAME="$2"
      shift 2
      ;;
    --location)
      LOCATION="$2"
      shift 2
      ;;
    --sku)
      SKU="$2"
      shift 2
      ;;
    --skip-build)
      SKIP_BUILD=true
      shift
      ;;
    --help)
      grep '^#' "$0" | tail -n +3 | head -n -1 | sed 's/^# \?//'
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

# Helper functions
print_header() {
    echo ""
    echo -e "${BLUE}============================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}============================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check prerequisites
print_header "Checking Prerequisites"

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    print_error "Azure CLI not found. Please install it first."
    exit 1
fi
print_success "Azure CLI installed"

# Check if logged in to Azure
if ! az account show &> /dev/null; then
    print_error "Not logged in to Azure. Please run: az login"
    exit 1
fi

ACCOUNT_NAME=$(az account show --query name -o tsv)
print_success "Logged in as: $ACCOUNT_NAME"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js not found. Please install it first."
    exit 1
fi
print_success "Node.js version: $(node --version)"

print_info "Configuration:"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  App Name: $APP_NAME"
echo "  Location: $LOCATION"
echo "  SKU: $SKU"
echo "  App Service Plan: $APP_SERVICE_PLAN"

# Confirm deployment
echo ""
read -p "Continue with deployment? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Deployment cancelled"
    exit 0
fi

# Step 1: Create Resource Group
print_header "Step 1: Creating Resource Group"

if az group show --name $RESOURCE_GROUP &> /dev/null; then
    print_warning "Resource group '$RESOURCE_GROUP' already exists"
else
    az group create \
      --name $RESOURCE_GROUP \
      --location $LOCATION \
      --output table
    print_success "Resource group created"
fi

# Step 2: Create App Service Plan
print_header "Step 2: Creating App Service Plan"

if az appservice plan show --name $APP_SERVICE_PLAN --resource-group $RESOURCE_GROUP &> /dev/null; then
    print_warning "App Service Plan '$APP_SERVICE_PLAN' already exists"
else
    az appservice plan create \
      --name $APP_SERVICE_PLAN \
      --resource-group $RESOURCE_GROUP \
      --is-linux \
      --sku $SKU \
      --output table
    print_success "App Service Plan created"
fi

# Step 3: Create Web App
print_header "Step 3: Creating Web App"

if az webapp show --name $APP_NAME --resource-group $RESOURCE_GROUP &> /dev/null; then
    print_warning "Web App '$APP_NAME' already exists"
else
    az webapp create \
      --name $APP_NAME \
      --resource-group $RESOURCE_GROUP \
      --plan $APP_SERVICE_PLAN \
      --runtime "NODE:20-lts" \
      --output table
    print_success "Web App created"
fi

# Step 4: Enable Managed Identity
print_header "Step 4: Enabling Managed Identity"

PRINCIPAL_ID=$(az webapp identity assign \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query principalId \
  --output tsv)

print_success "Managed Identity enabled"
print_info "Principal ID: $PRINCIPAL_ID"

# Wait for identity to propagate
print_info "Waiting for identity to propagate (30 seconds)..."
sleep 30

# Step 5: Grant Azure AI Permissions
print_header "Step 5: Granting Azure AI Permissions"

# Get Azure AI resource ID
AI_RESOURCE_ID=$(az cognitiveservices account show \
  --name $AI_RESOURCE_NAME \
  --resource-group $AI_RESOURCE_GROUP \
  --query id \
  --output tsv)

print_info "Azure AI Resource ID: $AI_RESOURCE_ID"

# Assign Cognitive Services User role
az role assignment create \
  --assignee $PRINCIPAL_ID \
  --role "Cognitive Services User" \
  --scope $AI_RESOURCE_ID \
  --output table

print_success "Managed Identity granted Azure AI access"

# Step 6: Configure Application Settings
print_header "Step 6: Configuring Application Settings"

az webapp config appsettings set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    AZURE_AI_ENDPOINT="$AI_ENDPOINT" \
    AZURE_AI_AGENT_ID="$AI_AGENT_ID" \
    NODE_ENV="production" \
    WEBSITE_NODE_DEFAULT_VERSION="20-lts" \
  --output table

print_success "Application settings configured"

# Step 7: Configure Startup Command
print_header "Step 7: Configuring Startup Command"

az webapp config set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --startup-file "bash startup.sh" \
  --output table

print_success "Startup command configured"

# Step 8: Enable HTTPS Only
print_header "Step 8: Enabling HTTPS Only"

az webapp update \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --https-only true \
  --output table

print_success "HTTPS-only mode enabled"

# Step 9: Enable Logging
print_header "Step 9: Enabling Application Logging"

az webapp log config \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --application-logging filesystem \
  --level information \
  --output table

print_success "Application logging enabled"

# Step 10: Build Application (if not skipped)
if [ "$SKIP_BUILD" = false ]; then
    print_header "Step 10: Building Application"

    npm install
    print_success "Dependencies installed"

    npm run build
    print_success "Application built successfully"
else
    print_warning "Skipping build step (--skip-build flag)"
fi

# Step 11: Deploy Application
print_header "Step 11: Deploying Application"

print_info "Creating deployment package..."

# Create deployment directory
rm -rf deployment
mkdir -p deployment

# Copy files
if [ -d ".next/standalone" ]; then
    print_info "Copying standalone build..."
    cp -r .next/standalone/* deployment/

    if [ -d ".next/static" ]; then
        mkdir -p deployment/.next/static
        cp -r .next/static/* deployment/.next/static/
    fi

    if [ -d "public" ]; then
        mkdir -p deployment/public
        cp -r public/* deployment/public/
    fi
else
    print_warning "Standalone build not found, copying full build..."
    cp -r .next deployment/
    cp -r node_modules deployment/
    cp -r public deployment/
    cp package*.json deployment/
fi

# Copy Azure configuration files
cp startup.sh deployment/
cp web.config deployment/ 2>/dev/null || true
cp .deployment deployment/ 2>/dev/null || true

# Make startup script executable
chmod +x deployment/startup.sh

print_success "Deployment package created"

# Deploy using ZIP deploy
print_info "Uploading to Azure..."

cd deployment
zip -r ../deploy.zip . > /dev/null
cd ..

az webapp deploy \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --src-path deploy.zip \
  --type zip \
  --output table

print_success "Application deployed"

# Cleanup
rm -rf deployment deploy.zip

# Step 12: Get App URL
print_header "Deployment Complete!"

APP_URL=$(az webapp show \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query defaultHostName \
  --output tsv)

print_success "Your app is live at: https://$APP_URL"

echo ""
print_info "Next Steps:"
echo "  1. Visit: https://$APP_URL"
echo "  2. Test a policy query"
echo "  3. View logs: az webapp log tail --name $APP_NAME --resource-group $RESOURCE_GROUP"
echo "  4. Monitor: https://portal.azure.com"
echo ""
print_success "Deployment completed successfully! 🎉"
