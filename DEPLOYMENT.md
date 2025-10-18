# Production Deployment Guide

## Azure Web Apps Deployment (Recommended - Most Secure)

This guide will walk you through deploying your Rush Policy Chat application to Azure Web Apps using **Managed Identity** for authentication - the most secure option with zero secrets to manage.

---

## 🚀 Quick Start (Fastest Deployment)

For the fastest deployment experience, use our automated script:

```bash
# Make scripts executable
chmod +x scripts/deploy-to-azure.sh
chmod +x scripts/verify-deployment.sh
chmod +x startup.sh

# Run automated deployment
./scripts/deploy-to-azure.sh

# Verify deployment
./scripts/verify-deployment.sh
```

**Total Time:** ~25 minutes | **See:** [AZURE_DEPLOYMENT_CHECKLIST.md](AZURE_DEPLOYMENT_CHECKLIST.md)

---

## Next.js Standalone Configuration ⚡

This app uses Next.js **standalone output mode** for optimal Azure Web Apps deployment:

- ✅ **Already configured** in `next.config.js`
- ✅ Creates minimal production server in `.next/standalone`
- ✅ Reduces deployment size by ~70%
- ✅ Faster cold starts and better performance

**How it works:**
1. `npm run build` creates `.next/standalone` directory
2. Standalone directory contains self-contained Node server
3. Azure runs `node .next/standalone/server.js`
4. No need to deploy `node_modules` (built-in)

---

## Prerequisites

1. **Azure CLI installed and authenticated**
   ```bash
   az login
   ```

2. **Azure Subscription Access**
   - Active subscription (current: RU-Azure-NonProd)
   - Permission to create resources
   - Access to the Azure AI resource

3. **GitHub Repository** (Optional - for CI/CD)
   - Code pushed to GitHub
   - Access to repository settings

4. **Node.js 18+** (for local build)
   ```bash
   node --version  # Should be >= 18.0.0
   ```

---

## Deployment Steps

### Step 1: Create Azure Resources (10 minutes)

```bash
# Set variables
RESOURCE_GROUP="rg-rush-policy-chat-prod"
LOCATION="eastus"
APP_NAME="rush-policy-chat"
APP_SERVICE_PLAN="asp-rush-policy-chat"

# Create resource group
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION

# Create App Service Plan (Linux, Node.js)
az appservice plan create \
  --name $APP_SERVICE_PLAN \
  --resource-group $RESOURCE_GROUP \
  --is-linux \
  --sku B1

# Create Web App
az webapp create \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --plan $APP_SERVICE_PLAN \
  --runtime "NODE:20-lts"
```

### Step 2: Enable Managed Identity (2 minutes)

```bash
# Enable system-assigned managed identity
az webapp identity assign \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP

# Get the identity's principal ID (save this!)
PRINCIPAL_ID=$(az webapp identity show \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query principalId \
  --output tsv)

echo "Managed Identity Principal ID: $PRINCIPAL_ID"
```

### Step 3: Grant Azure AI Permissions (5 minutes)

```bash
# Get your Azure AI resource details
AI_RESOURCE_GROUP="rua-nonprod-ai-innovation"  # Your AI resource group
AI_RESOURCE_NAME="rua-nonprod-ai-innovation"   # Your AI resource name

# Get the Azure AI resource ID
AI_RESOURCE_ID=$(az cognitiveservices account show \
  --name $AI_RESOURCE_NAME \
  --resource-group $AI_RESOURCE_GROUP \
  --query id \
  --output tsv)

# Assign "Cognitive Services User" role to the managed identity
az role assignment create \
  --assignee $PRINCIPAL_ID \
  --role "Cognitive Services User" \
  --scope $AI_RESOURCE_ID

echo "✅ Managed Identity granted access to Azure AI"
```

### Step 4: Configure Application Settings (3 minutes)

```bash
# Set environment variables
az webapp config appsettings set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    AZURE_AI_ENDPOINT="https://rua-nonprod-ai-innovation.services.ai.azure.com/api/projects/rua-nonprod-ai-innovation-project" \
    AZURE_AI_AGENT_ID="asst_301EhwakRXWsOCgGQt276WiU" \
    NODE_ENV="production" \
    WEBSITE_NODE_DEFAULT_VERSION="20-lts"

# Configure Next.js startup script
az webapp config set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --startup-file "bash startup.sh"
```

**Note:** The `startup.sh` script automatically:
- Detects standalone build
- Sets correct PORT from Azure environment
- Starts Next.js with optimal configuration

### Step 5: Deploy Code (2 methods)

#### Method A: GitHub Actions (Recommended for CI/CD)

1. **Generate deployment credentials:**
   ```bash
   az webapp deployment list-publishing-profiles \
     --name $APP_NAME \
     --resource-group $RESOURCE_GROUP \
     --xml
   ```

2. **Add GitHub Secrets:**
   - Go to your GitHub repo → Settings → Secrets and variables → Actions
   - Add secret: `AZURE_WEBAPP_PUBLISH_PROFILE`
   - Paste the XML output from step 1

3. **GitHub Actions workflow is already created** (see `.github/workflows/azure-deploy.yml`)

4. **Push to main branch:**
   ```bash
   git add .
   git commit -m "Deploy to Azure Web Apps"
   git push origin main
   ```

   GitHub Actions will automatically:
   - Build the Next.js app
   - Run tests
   - Deploy to Azure Web Apps

#### Method B: Direct Deployment (Quick test)

```bash
# Build the application locally
npm run build

# Deploy using az webapp up
az webapp up \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --runtime "NODE:20-lts"
```

### Step 6: Verify Deployment (2 minutes)

```bash
# Check deployment status
az webapp show \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query state

# Get the app URL
APP_URL=$(az webapp show \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query defaultHostName \
  --output tsv)

echo "🚀 Your app is live at: https://$APP_URL"

# View logs
az webapp log tail \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP
```

### Step 7: Test the Application

1. **Open the app:**
   ```bash
   open "https://$APP_URL"
   ```

2. **Test a policy query:**
   - Toggle to "Azure AI Agent"
   - Ask: "What is the HIPAA privacy policy?"
   - Verify you get a response from PolicyTech

3. **Check logs for any errors:**
   ```bash
   az webapp log tail --name $APP_NAME --resource-group $RESOURCE_GROUP
   ```

---

## How Managed Identity Works

### Local Development (Current Setup)
```javascript
// Uses Azure CLI authentication
const credential = new DefaultAzureCredential();
// Tries: Environment Variables → Managed Identity → Azure CLI ✅
```

### Production (Azure Web Apps)
```javascript
// Uses Managed Identity automatically - NO SECRETS!
const credential = new DefaultAzureCredential();
// Tries: Environment Variables → Managed Identity ✅ → Azure CLI
```

**Key Benefits:**
- ✅ **Zero secrets** - No credentials in code or environment variables
- ✅ **Automatic rotation** - Azure manages identity lifecycle
- ✅ **Audit trail** - All access logged in Azure AD
- ✅ **No code changes** - DefaultAzureCredential handles everything

---

## Troubleshooting

### Error: "CredentialUnavailableError"

**Cause:** Managed Identity not enabled or permissions not granted

**Fix:**
```bash
# Re-enable managed identity
az webapp identity assign --name $APP_NAME --resource-group $RESOURCE_GROUP

# Re-grant permissions
az role assignment create \
  --assignee $PRINCIPAL_ID \
  --role "Cognitive Services User" \
  --scope $AI_RESOURCE_ID
```

### Error: "Cannot reach Azure AI endpoint"

**Cause:** Network restrictions or firewall rules

**Fix:**
```bash
# Check if Azure AI resource allows access from Azure services
az cognitiveservices account show \
  --name $AI_RESOURCE_NAME \
  --resource-group $AI_RESOURCE_GROUP \
  --query properties.networkAcls
```

If network ACLs are restricting access, add Azure Web Apps subnet to allowed list.

### Error: "Application failed to start"

**Cause:** Build errors or missing dependencies

**Fix:**
```bash
# View detailed logs
az webapp log tail --name $APP_NAME --resource-group $RESOURCE_GROUP

# Check app settings
az webapp config appsettings list \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP
```

### Error: "Module not found"

**Cause:** Dependencies not installed during build

**Fix:** Ensure `package.json` has correct build script:
```json
{
  "scripts": {
    "build": "next build",
    "start": "next start -p $PORT"
  }
}
```

---

## Monitoring and Maintenance

### View Application Logs
```bash
# Real-time logs
az webapp log tail --name $APP_NAME --resource-group $RESOURCE_GROUP

# Download logs
az webapp log download \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --log-file app-logs.zip
```

### Monitor Performance
```bash
# CPU and memory metrics
az monitor metrics list \
  --resource $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --resource-type "Microsoft.Web/sites" \
  --metric "CpuPercentage" "MemoryPercentage"
```

### Enable Application Insights (Optional but Recommended)

```bash
# Create Application Insights resource
az monitor app-insights component create \
  --app rush-policy-chat-insights \
  --location $LOCATION \
  --resource-group $RESOURCE_GROUP

# Get instrumentation key
INSTRUMENTATION_KEY=$(az monitor app-insights component show \
  --app rush-policy-chat-insights \
  --resource-group $RESOURCE_GROUP \
  --query instrumentationKey \
  --output tsv)

# Add to app settings
az webapp config appsettings set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings APPINSIGHTS_INSTRUMENTATIONKEY=$INSTRUMENTATION_KEY
```

---

## Scaling and Performance

### Scale Up (Upgrade Plan)
```bash
# Upgrade to Standard S1 for production
az appservice plan update \
  --name $APP_SERVICE_PLAN \
  --resource-group $RESOURCE_GROUP \
  --sku S1
```

### Scale Out (Add Instances)
```bash
# Auto-scale based on CPU usage
az monitor autoscale create \
  --resource-group $RESOURCE_GROUP \
  --resource $APP_SERVICE_PLAN \
  --resource-type "Microsoft.Web/serverfarms" \
  --name autoscale-rush-policy \
  --min-count 1 \
  --max-count 3 \
  --count 1

az monitor autoscale rule create \
  --resource-group $RESOURCE_GROUP \
  --autoscale-name autoscale-rush-policy \
  --condition "CpuPercentage > 70 avg 5m" \
  --scale out 1
```

---

## Security Best Practices

### 1. Enable HTTPS Only
```bash
az webapp update \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --https-only true
```

### 2. Restrict Access to Rush Network (Optional)
```bash
# Add IP restriction for Rush network
az webapp config access-restriction add \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --rule-name "Rush Network" \
  --action Allow \
  --ip-address "YOUR_RUSH_IP_RANGE" \
  --priority 100
```

### 3. Enable Diagnostic Logging
```bash
az webapp log config \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --application-logging filesystem \
  --level information
```

### 4. Regular Updates
```bash
# Update Node.js runtime
az webapp config set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --linux-fx-version "NODE:20-lts"
```

---

## Cost Estimates

### Basic Tier (B1) - Development/Testing
- **Cost:** ~$13/month
- **Specs:** 1.75 GB RAM, 1 vCPU
- **Use case:** Testing, low traffic

### Standard Tier (S1) - Production
- **Cost:** ~$70/month
- **Specs:** 1.75 GB RAM, 1 vCPU, custom domains, SSL
- **Use case:** Production, moderate traffic

### Premium Tier (P1v3) - Enterprise
- **Cost:** ~$150/month
- **Specs:** 8 GB RAM, 2 vCPUs, VNet integration
- **Use case:** High traffic, enterprise features

**Note:** Azure AI Agent usage billed separately based on usage.

---

## Alternative: Vercel Deployment

If you prefer Vercel (simpler but requires Service Principal):

1. **Create Service Principal:**
   ```bash
   az ad sp create-for-rbac --name "rush-policy-chat-vercel"
   ```

2. **Add to Vercel Environment Variables:**
   - `AZURE_CLIENT_ID`
   - `AZURE_CLIENT_SECRET`
   - `AZURE_TENANT_ID`
   - `AZURE_AI_ENDPOINT`
   - `AZURE_AI_AGENT_ID`

3. **Deploy:**
   ```bash
   vercel --prod
   ```

**Trade-off:** Vercel is simpler but requires managing secrets. Azure Web Apps with Managed Identity is more secure.

---

## Support and Resources

- **Azure Web Apps Docs:** https://learn.microsoft.com/en-us/azure/app-service/
- **Managed Identity Guide:** https://learn.microsoft.com/en-us/azure/app-service/overview-managed-identity
- **Azure AI Projects SDK:** https://learn.microsoft.com/en-us/azure/ai-studio/
- **Next.js Deployment:** https://nextjs.org/docs/deployment

---

## Quick Reference Commands

```bash
# View app status
az webapp show --name $APP_NAME --resource-group $RESOURCE_GROUP --query state

# Restart app
az webapp restart --name $APP_NAME --resource-group $RESOURCE_GROUP

# View logs
az webapp log tail --name $APP_NAME --resource-group $RESOURCE_GROUP

# Update environment variables
az webapp config appsettings set --name $APP_NAME --resource-group $RESOURCE_GROUP --settings KEY=VALUE

# Stop app
az webapp stop --name $APP_NAME --resource-group $RESOURCE_GROUP

# Start app
az webapp start --name $APP_NAME --resource-group $RESOURCE_GROUP

# Delete app (careful!)
az webapp delete --name $APP_NAME --resource-group $RESOURCE_GROUP
```

---

## Summary

✅ **Total Setup Time:** ~25-35 minutes
✅ **Security:** Enterprise-grade with Managed Identity
✅ **Scalability:** Auto-scale from 1-10+ instances
✅ **Cost:** Starting at $13/month
✅ **Maintenance:** Minimal - Azure handles infrastructure

Your Rush Policy Chat app will be running in production with zero secrets and enterprise-grade security!
