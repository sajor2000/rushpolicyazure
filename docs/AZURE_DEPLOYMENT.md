# Azure App Service Deployment Guide

Comprehensive guide for deploying the Rush Policy Chat Assistant to Azure App Service with Azure AI Agent integration.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Pre-Deployment Setup](#pre-deployment-setup)
3. [Azure Resources Creation](#azure-resources-creation)
4. [Application Configuration](#application-configuration)
5. [Deployment Methods](#deployment-methods)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Production Configuration](#production-configuration)
8. [Monitoring and Maintenance](#monitoring-and-maintenance)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools
- **Azure CLI**: Version 2.50.0 or higher
  ```bash
  az --version
  # Install: https://docs.microsoft.com/cli/azure/install-azure-cli
  ```

- **Node.js**: Version 18.0.0 or higher
  ```bash
  node --version
  npm --version
  ```

- **Git**: For repository management
  ```bash
  git --version
  ```

### Required Access
- Azure subscription with appropriate permissions
- Access to Rush University Azure AI Project endpoint
- Azure AI Agent ID: `asst_301EhwakRXWsOCgGQt276WiU`

### Important Notes
- ✅ This application uses **Azure AI Agent** (GPT-5 Chat Model)
- ✅ Authentication via **DefaultAzureCredential** (Managed Identity recommended)
- ✅ **NO API keys required** when using Managed Identity
- ✅ Thread management is **stateless** (fresh thread per request for RAG accuracy)

---

## Pre-Deployment Setup

### Step 1: Login to Azure

```bash
# Login to your Azure account
az login

# Verify you're logged in
az account show

# Set the subscription (if you have multiple)
az account set --subscription "Your-Subscription-Name"
```

### Step 2: Clone and Prepare Application

```bash
# Clone the repository
git clone <your-repo-url>
cd rushpolicychatlocal

# Install dependencies
npm install

# Verify build works locally
npm run build

# Test the build
npm run start:azure
# Visit http://localhost:3000 to verify
```

### Step 3: Verify Environment Configuration

Create `.env.local` from the example:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values:

```env
# Azure AI Agent Configuration
AZURE_AI_ENDPOINT=https://rua-nonprod-ai-innovation.services.ai.azure.com/api/projects/rua-nonprod-ai-innovation-project
AZURE_AI_AGENT_ID=asst_301EhwakRXWsOCgGQt276WiU

# Azure Authentication (only for local testing)
# AZURE_CLIENT_ID=your-client-id
# AZURE_CLIENT_SECRET=your-client-secret
# AZURE_TENANT_ID=your-tenant-id
```

Test locally:

```bash
# Test Azure AI Agent connection
node scripts/test-azure-agent.js

# Expected output: "✅ Azure AI Agent test completed successfully!"
```

---

## Azure Resources Creation

### Step 1: Create Resource Group

```bash
# Create resource group in your preferred region
az group create \
  --name rush-policy-chat-rg \
  --location "East US"

# Verify creation
az group show --name rush-policy-chat-rg
```

### Step 2: Create App Service Plan

Choose appropriate SKU based on your needs:
- **B1** ($55/month): Development/staging
- **S1** ($75/month): Small production
- **P1V2** ($146/month): Production with scaling

```bash
# Create App Service Plan (Linux with Node 18)
az appservice plan create \
  --name rush-policy-plan \
  --resource-group rush-policy-chat-rg \
  --sku B1 \
  --is-linux

# Verify creation
az appservice plan show \
  --name rush-policy-plan \
  --resource-group rush-policy-chat-rg
```

### Step 3: Create Web App

```bash
# Create Web App with Node.js 18 runtime
az webapp create \
  --resource-group rush-policy-chat-rg \
  --plan rush-policy-plan \
  --name rush-policy-chat-app \
  --runtime "NODE|18-lts"

# Verify creation and get URL
az webapp show \
  --resource-group rush-policy-chat-rg \
  --name rush-policy-chat-app \
  --query defaultHostName --output tsv
```

**Your app will be available at**: `https://rush-policy-chat-app.azurewebsites.net`

---

## Application Configuration

### Step 1: Configure Environment Variables

**CRITICAL**: Set these environment variables in Azure App Service:

```bash
az webapp config appsettings set \
  --resource-group rush-policy-chat-rg \
  --name rush-policy-chat-app \
  --settings \
    AZURE_AI_ENDPOINT="https://rua-nonprod-ai-innovation.services.ai.azure.com/api/projects/rua-nonprod-ai-innovation-project" \
    AZURE_AI_AGENT_ID="asst_301EhwakRXWsOCgGQt276WiU" \
    NODE_ENV="production" \
    ALLOWED_ORIGIN="https://rush-policy-chat-app.azurewebsites.net" \
    WEBSITE_NODE_DEFAULT_VERSION="18-lts"
```

**Verify settings**:

```bash
az webapp config appsettings list \
  --resource-group rush-policy-chat-rg \
  --name rush-policy-chat-app \
  --output table
```

### Step 2: Configure Startup Command

**IMPORTANT**: Next.js standalone mode requires specific startup command:

```bash
az webapp config set \
  --resource-group rush-policy-chat-rg \
  --name rush-policy-chat-app \
  --startup-file "node .next/standalone/server.js"
```

**Verify startup command**:

```bash
az webapp config show \
  --resource-group rush-policy-chat-rg \
  --name rush-policy-chat-app \
  --query appCommandLine
```

### Step 3: Enable Managed Identity (Recommended)

**Why**: Managed Identity eliminates the need for credentials in code or environment variables.

```bash
# Enable system-assigned managed identity
az webapp identity assign \
  --resource-group rush-policy-chat-rg \
  --name rush-policy-chat-app

# Get the principal ID (needed for permissions)
PRINCIPAL_ID=$(az webapp identity show \
  --resource-group rush-policy-chat-rg \
  --name rush-policy-chat-app \
  --query principalId --output tsv)

echo "Managed Identity Principal ID: $PRINCIPAL_ID"
```

**Grant Permissions** (coordinate with Azure admin):

The Managed Identity needs:
- **Cognitive Services User** role on Azure AI Project
- Access to Azure AI endpoint

```bash
# Example: Grant access to Azure AI resource
az role assignment create \
  --assignee $PRINCIPAL_ID \
  --role "Cognitive Services User" \
  --scope "/subscriptions/{subscription-id}/resourceGroups/{ai-resource-group}/providers/Microsoft.CognitiveServices/accounts/{ai-account-name}"
```

### Step 4: Configure HTTPS and Security

```bash
# Enforce HTTPS only
az webapp update \
  --resource-group rush-policy-chat-rg \
  --name rush-policy-chat-app \
  --https-only true

# Enable HTTP 2.0
az webapp config set \
  --resource-group rush-policy-chat-rg \
  --name rush-policy-chat-app \
  --http20-enabled true

# Set minimum TLS version
az webapp config set \
  --resource-group rush-policy-chat-rg \
  --name rush-policy-chat-app \
  --min-tls-version 1.2
```

---

## Deployment Methods

### Option 1: Local Git Deployment (Recommended for Testing)

```bash
# Step 1: Configure local git deployment
az webapp deployment source config-local-git \
  --resource-group rush-policy-chat-rg \
  --name rush-policy-chat-app

# Step 2: Get deployment credentials
DEPLOY_URL=$(az webapp deployment source config-local-git \
  --resource-group rush-policy-chat-rg \
  --name rush-policy-chat-app \
  --query url --output tsv)

echo "Git Deploy URL: $DEPLOY_URL"

# Step 3: Add Azure remote
git remote add azure $DEPLOY_URL

# Step 4: Deploy
git push azure main

# Monitor deployment logs
az webapp log tail \
  --resource-group rush-policy-chat-rg \
  --name rush-policy-chat-app
```

### Option 2: GitHub Actions (Recommended for Production)

```bash
# Step 1: Configure GitHub deployment
az webapp deployment github-actions add \
  --resource-group rush-policy-chat-rg \
  --name rush-policy-chat-app \
  --repo "your-github-username/rush-policy-chat" \
  --branch main \
  --login-with-github

# This creates .github/workflows/azure-webapps-node.yml
```

**Verify GitHub Action**:
- Check repository → Actions tab
- Ensure secrets are configured: `AZURE_WEBAPP_PUBLISH_PROFILE`

### Option 3: Azure DevOps Pipeline

Create `azure-pipelines.yml` in repository root:

```yaml
trigger:
  - main

pool:
  vmImage: 'ubuntu-latest'

steps:
- task: NodeTool@0
  inputs:
    versionSpec: '18.x'
  displayName: 'Install Node.js'

- script: |
    npm install
    npm run build
  displayName: 'npm install and build'

- task: AzureWebApp@1
  inputs:
    azureSubscription: 'Your-Service-Connection'
    appName: 'rush-policy-chat-app'
    package: $(System.DefaultWorkingDirectory)/.next/standalone
```

### Option 4: ZIP Deployment (Quick Deploy)

```bash
# Step 1: Build application locally
npm run build

# Step 2: Create deployment package
cd .next/standalone
zip -r ../../deploy.zip .
cd ../..

# Step 3: Deploy ZIP file
az webapp deployment source config-zip \
  --resource-group rush-policy-chat-rg \
  --name rush-policy-chat-app \
  --src deploy.zip

# Clean up
rm deploy.zip
```

---

## Post-Deployment Verification

### Step 1: Check Deployment Status

```bash
# Check app status
az webapp show \
  --resource-group rush-policy-chat-rg \
  --name rush-policy-chat-app \
  --query state

# Expected output: "Running"
```

### Step 2: Test Health Endpoint

```bash
# Test health check
curl https://rush-policy-chat-app.azurewebsites.net/api/health

# Expected response:
# {
#   "status": "ok",
#   "message": "Rush Policy Chat Assistant is running",
#   "timestamp": "2025-01-27T..."
# }
```

### Step 3: Test Azure AI Agent Connection

```bash
# Test AI Agent endpoint (use POST request)
curl -X POST https://rush-policy-chat-app.azurewebsites.net/api/azure-agent \
  -H "Content-Type: application/json" \
  -d '{"message":"What is the tuberculosis exposure policy?"}'

# Should return policy information with ANSWER and FULL_POLICY_DOCUMENT sections
```

### Step 4: Review Application Logs

```bash
# Enable logging
az webapp log config \
  --resource-group rush-policy-chat-rg \
  --name rush-policy-chat-app \
  --application-logging filesystem \
  --level information

# Stream logs
az webapp log tail \
  --resource-group rush-policy-chat-rg \
  --name rush-policy-chat-app

# Look for:
# ✅ "Fresh thread created"
# ✅ "RAG VALIDATION: Found X citations"
# ✅ "Thread cleaned up"
```

### Step 5: Test from Browser

1. Navigate to: `https://rush-policy-chat-app.azurewebsites.net`
2. Ask a test question: "What is the tuberculosis exposure policy?"
3. Verify:
   - Response appears within 10-30 seconds
   - Answer and full document sections are displayed
   - Copy buttons work
   - No console errors (F12 Developer Tools)

---

## Production Configuration

### 1. Configure Custom Domain

```bash
# Add custom domain
az webapp config hostname add \
  --resource-group rush-policy-chat-rg \
  --webapp-name rush-policy-chat-app \
  --hostname policy-chat.rush.edu

# Verify domain
az webapp config hostname list \
  --resource-group rush-policy-chat-rg \
  --webapp-name rush-policy-chat-app

# Update ALLOWED_ORIGIN environment variable
az webapp config appsettings set \
  --resource-group rush-policy-chat-rg \
  --name rush-policy-chat-app \
  --settings ALLOWED_ORIGIN="https://policy-chat.rush.edu"
```

### 2. Configure SSL Certificate

```bash
# Purchase App Service Certificate (or bring your own)
az webapp config ssl bind \
  --resource-group rush-policy-chat-rg \
  --name rush-policy-chat-app \
  --certificate-thumbprint <your-cert-thumbprint> \
  --ssl-type SNI
```

### 3. Enable Application Insights

```bash
# Create Application Insights
az monitor app-insights component create \
  --app rush-policy-insights \
  --location "East US" \
  --resource-group rush-policy-chat-rg \
  --application-type Node.JS

# Get instrumentation key
INSTRUMENTATION_KEY=$(az monitor app-insights component show \
  --app rush-policy-insights \
  --resource-group rush-policy-chat-rg \
  --query instrumentationKey --output tsv)

# Configure app to use Application Insights
az webapp config appsettings set \
  --resource-group rush-policy-chat-rg \
  --name rush-policy-chat-app \
  --settings APPINSIGHTS_INSTRUMENTATIONKEY="$INSTRUMENTATION_KEY"
```

### 4. Configure Auto-Scaling

```bash
# Create autoscale profile
az monitor autoscale create \
  --resource-group rush-policy-chat-rg \
  --resource rush-policy-chat-app \
  --resource-type Microsoft.Web/sites \
  --name rush-policy-autoscale \
  --min-count 1 \
  --max-count 5 \
  --count 1

# Add scale-out rule (CPU > 70%)
az monitor autoscale rule create \
  --resource-group rush-policy-chat-rg \
  --autoscale-name rush-policy-autoscale \
  --condition "Percentage CPU > 70 avg 10m" \
  --scale out 1

# Add scale-in rule (CPU < 30%)
az monitor autoscale rule create \
  --resource-group rush-policy-chat-rg \
  --autoscale-name rush-policy-autoscale \
  --condition "Percentage CPU < 30 avg 10m" \
  --scale in 1
```

### 5. Configure Health Check Monitoring

```bash
# Enable health check
az webapp config set \
  --resource-group rush-policy-chat-rg \
  --name rush-policy-chat-app \
  --generic-configurations '{"healthCheckPath": "/api/health"}'
```

### 6. Configure Backup (Optional but Recommended)

```bash
# Create storage account for backups
az storage account create \
  --name rushpolicychatbackup \
  --resource-group rush-policy-chat-rg \
  --location "East US" \
  --sku Standard_LRS

# Configure automated backup
az webapp config backup update \
  --resource-group rush-policy-chat-rg \
  --webapp-name rush-policy-chat-app \
  --storage-account-url <storage-sas-url> \
  --frequency 1d \
  --retain-one true \
  --retention 30
```

---

## Monitoring and Maintenance

### Application Insights Queries

Access Azure Portal → Application Insights → Logs, then run:

**Query 1: Application Errors**
```kusto
exceptions
| where timestamp > ago(24h)
| summarize count() by type, outerMessage
| order by count_ desc
```

**Query 2: Request Performance**
```kusto
requests
| where timestamp > ago(24h)
| where name contains "azure-agent"
| summarize avg(duration), percentile(duration, 95), count() by name
| order by avg_duration desc
```

**Query 3: RAG Validation Warnings**
```kusto
traces
| where timestamp > ago(24h)
| where message contains "RAG WARNING"
| project timestamp, message
| order by timestamp desc
```

**Query 4: Rate Limiting Events**
```kusto
traces
| where timestamp > ago(24h)
| where message contains "Rate limit exceeded"
| summarize count() by bin(timestamp, 1h)
```

### Performance Monitoring

```bash
# Monitor resource usage
az monitor metrics list \
  --resource rush-policy-chat-app \
  --resource-group rush-policy-chat-rg \
  --resource-type Microsoft.Web/sites \
  --metric "CpuPercentage" \
  --start-time 2025-01-27T00:00:00Z

# Monitor memory usage
az monitor metrics list \
  --resource rush-policy-chat-app \
  --resource-group rush-policy-chat-rg \
  --resource-type Microsoft.Web/sites \
  --metric "MemoryPercentage" \
  --start-time 2025-01-27T00:00:00Z
```

### Maintenance Commands

```bash
# Restart application
az webapp restart \
  --resource-group rush-policy-chat-rg \
  --name rush-policy-chat-app

# Stop application
az webapp stop \
  --resource-group rush-policy-chat-rg \
  --name rush-policy-chat-app

# Start application
az webapp start \
  --resource-group rush-policy-chat-rg \
  --name rush-policy-chat-app

# View current configuration
az webapp config show \
  --resource-group rush-policy-chat-rg \
  --name rush-policy-chat-app

# SSH into app service (for debugging)
az webapp ssh \
  --resource-group rush-policy-chat-rg \
  --name rush-policy-chat-app
```

---

## Troubleshooting

### Issue 1: Application Won't Start

**Symptoms**: App shows "Service Unavailable" or "Application Error"

**Solution Steps**:

```bash
# Step 1: Check logs
az webapp log tail \
  --resource-group rush-policy-chat-rg \
  --name rush-policy-chat-app

# Step 2: Verify startup command
az webapp config show \
  --resource-group rush-policy-chat-rg \
  --name rush-policy-chat-app \
  --query appCommandLine

# Should be: "node .next/standalone/server.js"

# Step 3: Verify Node version
az webapp config show \
  --resource-group rush-policy-chat-rg \
  --name rush-policy-chat-app \
  --query linuxFxVersion

# Should contain: "NODE|18-lts"

# Step 4: Check environment variables
az webapp config appsettings list \
  --resource-group rush-policy-chat-rg \
  --name rush-policy-chat-app \
  --output table

# Step 5: Restart app
az webapp restart \
  --resource-group rush-policy-chat-rg \
  --name rush-policy-chat-app
```

### Issue 2: Azure AI Agent Connection Fails

**Symptoms**: API returns "Azure connection failed" or 401 errors

**Solution Steps**:

```bash
# Step 1: Verify environment variables are set
az webapp config appsettings list \
  --resource-group rush-policy-chat-rg \
  --name rush-policy-chat-app \
  --query "[?name=='AZURE_AI_ENDPOINT' || name=='AZURE_AI_AGENT_ID']"

# Step 2: Check Managed Identity is enabled
az webapp identity show \
  --resource-group rush-policy-chat-rg \
  --name rush-policy-chat-app

# Step 3: Verify Managed Identity has permissions
# Contact Azure admin to verify role assignments

# Step 4: Test from SSH session
az webapp ssh \
  --resource-group rush-policy-chat-rg \
  --name rush-policy-chat-app

# In SSH session:
cd /home/site/wwwroot
node scripts/test-azure-agent.js
```

**Alternative**: Use service principal instead of Managed Identity:

```bash
az webapp config appsettings set \
  --resource-group rush-policy-chat-rg \
  --name rush-policy-chat-app \
  --settings \
    AZURE_CLIENT_ID="your-client-id" \
    AZURE_CLIENT_SECRET="your-client-secret" \
    AZURE_TENANT_ID="your-tenant-id"
```

### Issue 3: Static Files Not Loading

**Symptoms**: CSS/JS not loading, 404 errors for static assets

**Solution**:

The `postbuild` script should automatically copy static files. Verify:

```bash
# Check if postbuild ran during deployment
az webapp log tail \
  --resource-group rush-policy-chat-rg \
  --name rush-policy-chat-app

# Look for: "cp -r public .next/standalone/"

# If not found, manually copy after build:
# In your deployment pipeline, after npm run build:
cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/
```

### Issue 4: Rate Limiting Too Aggressive

**Symptoms**: Users getting "Rate limit exceeded" errors

**Solution**: Adjust rate limit in `app/constants.js`:

```javascript
// Current: 20 requests per minute
export const RATE_LIMIT = {
  WINDOW_MS: 60000,      // 1 minute
  MAX_REQUESTS: 20,      // Increase this value
  CLEANUP_PROBABILITY: 0.01
};
```

Redeploy after changing.

### Issue 5: Slow Response Times

**Symptoms**: Requests taking > 60 seconds

**Diagnostics**:

```bash
# Check Application Insights for slow requests
# Portal → Application Insights → Performance

# Check if scale-out is needed
az monitor autoscale show \
  --resource-group rush-policy-chat-rg \
  --name rush-policy-autoscale

# Manually scale if needed
az appservice plan update \
  --resource-group rush-policy-chat-rg \
  --name rush-policy-plan \
  --number-of-workers 3
```

### Issue 6: Memory Leaks or High Memory Usage

**Solution**: Add memory monitoring and restart schedule:

```bash
# Check current memory usage
az monitor metrics list \
  --resource rush-policy-chat-app \
  --resource-group rush-policy-chat-rg \
  --resource-type Microsoft.Web/sites \
  --metric "MemoryWorkingSet"

# Schedule periodic restarts (if needed)
# Create Logic App or Function App to restart weekly
```

### Common Error Messages

| Error Message | Cause | Solution |
|---------------|-------|----------|
| `ENOTFOUND` | Cannot reach Azure endpoint | Check network/firewall settings |
| `401 Unauthorized` | Authentication failed | Verify Managed Identity permissions |
| `404 Not Found` | Static files missing | Run postbuild script |
| `429 Rate Limited` | Too many requests | Adjust RATE_LIMIT settings |
| `504 Gateway Timeout` | Agent response too slow | Check Azure AI service status |
| `No response from agent` | Agent not responding | Verify AZURE_AI_AGENT_ID is correct |

---

## Additional Resources

- [Azure App Service Documentation](https://docs.microsoft.com/azure/app-service/)
- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [Azure DefaultAzureCredential Guide](https://docs.microsoft.com/azure/developer/javascript/sdk/authentication/credential-chains)
- [Application Insights for Node.js](https://docs.microsoft.com/azure/azure-monitor/app/nodejs)

---

## Cost Optimization Tips

1. **Use appropriate App Service Plan tier**:
   - Development: B1 ($55/month)
   - Production: S1+ ($75+/month)

2. **Enable auto-scaling** to handle traffic spikes efficiently

3. **Monitor Azure AI API usage** - Each request creates a thread (stateless)

4. **Use Azure Cost Management** for budget alerts:
   ```bash
   az consumption budget create \
     --resource-group rush-policy-chat-rg \
     --budget-name rush-policy-budget \
     --amount 200 \
     --time-grain Monthly
   ```

5. **Consider Azure Reservations** for 1-3 year commitments (up to 72% savings)

---

## Security Best Practices Checklist

- [ ] HTTPS enforced (`--https-only true`)
- [ ] Managed Identity enabled and configured
- [ ] Custom domain with SSL certificate
- [ ] Rate limiting enabled (default: 20 req/min)
- [ ] Input sanitization active (control characters, length limits)
- [ ] Security headers configured (CSP, HSTS, X-Frame-Options)
- [ ] Application Insights enabled for monitoring
- [ ] Regular security updates (`npm audit fix`)
- [ ] Environment variables secured (no secrets in code)
- [ ] CORS configured with specific origins
- [ ] Health check endpoint monitoring enabled

---

## Support

For deployment issues:
- Review application logs: `az webapp log tail`
- Check Application Insights for errors
- Verify environment variables are set correctly
- Ensure Managed Identity has proper permissions
- Test Azure AI Agent connection: `node scripts/test-azure-agent.js`

For Azure-specific support:
- [Azure Support](https://azure.microsoft.com/support/)
- [Azure Status](https://status.azure.com/)

---

**Last Updated**: January 2025
**Application Version**: 1.0.0
**Deployment Model**: Azure AI Agent with stateless RAG architecture
