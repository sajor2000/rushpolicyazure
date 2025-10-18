# Azure Web Apps Deployment - Ready to Deploy! 🚀

All Azure Web Apps deployment files have been created and configured. Your Rush Policy Chat application is ready to deploy to production.

---

## ✅ Files Created

### Core Deployment Files
1. ✅ **startup.sh** - Azure Web Apps startup script
   - Handles dynamic PORT assignment
   - Detects standalone build automatically
   - Includes logging for diagnostics

2. ✅ **.deployment** - Azure build configuration
   - Configures npm install and build during deployment
   - Ensures correct Node.js environment

3. ✅ **web.config** - IIS routing configuration
   - Routes all requests through Next.js
   - Security headers configured
   - Compression and caching enabled

4. ✅ **package.json** - Updated with `start:azure` script
   - Supports standalone server execution

### Automation Scripts
5. ✅ **scripts/deploy-to-azure.sh** - One-command deployment
   - Creates all Azure resources
   - Enables Managed Identity
   - Grants Azure AI permissions
   - Deploys application code
   - Full automation with progress indicators

6. ✅ **scripts/verify-deployment.sh** - Post-deployment validation
   - 12 comprehensive checks
   - Tests web app health
   - Validates Managed Identity
   - Checks Azure AI permissions
   - Tests HTTP endpoints

### CI/CD Pipeline
7. ✅ **.github/workflows/azure-webapps-deploy.yml** - GitHub Actions workflow
   - Automated build and deployment
   - Triggers on push to main
   - Creates deployment artifacts
   - Supports staging and production

### Documentation
8. ✅ **AZURE_DEPLOYMENT_CHECKLIST.md** - Pre-flight checklist
   - Quick reference guide
   - Common issues and solutions
   - Environment-specific settings
   - Quick reference commands

9. ✅ **DEPLOYMENT.md** - Updated with Next.js notes
   - Quick start section added
   - Standalone mode explained
   - Complete step-by-step guide

---

## 🚀 Three Ways to Deploy

### Option 1: Automated Script (Recommended for First Deployment)

**Fastest and easiest method:**

```bash
# Run one-command deployment
./scripts/deploy-to-azure.sh

# Verify everything works
./scripts/verify-deployment.sh
```

**Time:** ~25 minutes | **Skill Level:** Beginner

**What it does:**
- Creates resource group
- Creates App Service Plan (B1 tier)
- Creates Web App
- Enables Managed Identity
- Grants Azure AI permissions
- Configures app settings
- Builds and deploys code
- Enables HTTPS and logging

---

### Option 2: GitHub Actions CI/CD (Recommended for Production)

**Best for continuous deployment:**

1. **Get publish profile:**
   ```bash
   az webapp deployment list-publishing-profiles \
     --name rush-policy-chat \
     --resource-group rg-rush-policy-chat-prod \
     --xml
   ```

2. **Add to GitHub Secrets:**
   - Go to your repo → Settings → Secrets and variables → Actions
   - Add secret: `AZURE_WEBAPP_PUBLISH_PROFILE`
   - Paste the XML from step 1

3. **Deploy:**
   ```bash
   git add .
   git commit -m "Deploy to Azure Web Apps"
   git push origin main
   ```

   GitHub Actions will automatically build and deploy!

**Time:** ~15 minutes (after initial setup) | **Skill Level:** Intermediate

---

### Option 3: Manual Step-by-Step (Advanced Users)

Follow the complete manual guide in [DEPLOYMENT.md](DEPLOYMENT.md)

**Time:** ~35 minutes | **Skill Level:** Advanced

---

## 📋 Pre-Deployment Checklist

Before deploying, verify:

- [ ] **Azure CLI installed** - `az --version`
- [ ] **Logged in to Azure** - `az login`
- [ ] **Application builds locally** - `npm run build`
- [ ] **Dependencies installed** - `npm install`
- [ ] **Scripts are executable** - ✅ Already done!

---

## 🎯 What Happens During Deployment

### 1. Azure Resources Created
- Resource Group: `rg-rush-policy-chat-prod`
- App Service Plan: `asp-rush-policy-chat` (B1 tier, Linux)
- Web App: `rush-policy-chat`
- Managed Identity: System-assigned (automatic)

### 2. Security Configuration
- Managed Identity enabled (zero secrets!)
- "Cognitive Services User" role assigned
- HTTPS-only mode enabled
- Security headers configured

### 3. Application Configuration
- Environment variables set:
  - `AZURE_AI_ENDPOINT`
  - `AZURE_AI_AGENT_ID`
  - `NODE_ENV=production`
- Startup command: `bash startup.sh`
- Logging enabled (information level)

### 4. Code Deployment
- Next.js standalone build created
- Static assets copied
- Application uploaded to Azure
- Server started automatically

---

## 🔍 Post-Deployment Verification

### Automatic Verification

Run the verification script:

```bash
./scripts/verify-deployment.sh
```

**This checks:**
- ✅ Web app status (should be "Running")
- ✅ Managed Identity enabled
- ✅ Azure AI permissions granted
- ✅ Environment variables configured
- ✅ HTTPS enabled
- ✅ Homepage accessible (HTTP 200)
- ✅ API endpoint responding
- ✅ No errors in logs

### Manual Testing

1. **Visit your app:**
   ```
   https://rush-policy-chat.azurewebsites.net
   ```

2. **Ask a test question:**
   - "What is the HIPAA privacy policy?"
   - "How does PTO accrual work?"
   - "What is the infection control policy?"

3. **Verify response:**
   - Should see professional PDF-style document
   - Includes policy number and metadata
   - Response comes from PolicyTech database

---

## 📊 Cost Estimate

### B1 Tier (Development/Testing)
- **Monthly Cost:** ~$13
- **Specs:** 1.75 GB RAM, 1 vCPU
- **Best for:** Testing, demos, low traffic

### S1 Tier (Production)
- **Monthly Cost:** ~$70
- **Specs:** 1.75 GB RAM, 1 vCPU, auto-scale, custom domains
- **Best for:** Internal employee access

### P1v3 Tier (Enterprise)
- **Monthly Cost:** ~$150
- **Specs:** 8 GB RAM, 2 vCPUs, VNet integration
- **Best for:** High traffic, advanced networking

**Note:** Azure AI usage billed separately based on API calls.

---

## 🛠️ Common Operations

### View Logs
```bash
az webapp log tail \
  --name rush-policy-chat \
  --resource-group rg-rush-policy-chat-prod
```

### Restart App
```bash
az webapp restart \
  --name rush-policy-chat \
  --resource-group rg-rush-policy-chat-prod
```

### Update Environment Variable
```bash
az webapp config appsettings set \
  --name rush-policy-chat \
  --resource-group rg-rush-policy-chat-prod \
  --settings KEY=VALUE
```

### Scale Up (Upgrade to S1)
```bash
az appservice plan update \
  --name asp-rush-policy-chat \
  --resource-group rg-rush-policy-chat-prod \
  --sku S1
```

### Scale Out (Add Instances)
```bash
az appservice plan update \
  --name asp-rush-policy-chat \
  --resource-group rg-rush-policy-chat-prod \
  --number-of-workers 3
```

---

## 🎓 Key Technical Features

### Next.js Standalone Mode ⚡
- **70% smaller** deployment size
- **Faster cold starts** - minimal dependencies
- **Self-contained** server - no need to deploy node_modules
- **Optimal for Azure** - perfect for App Service

### Managed Identity Security 🔒
- **Zero secrets** - no credentials in code or environment
- **Automatic rotation** - Azure manages lifecycle
- **Audit trail** - all access logged in Azure AD
- **No code changes** - DefaultAzureCredential handles everything

### Azure Web Apps Benefits 🚀
- **Auto-scaling** - handle traffic spikes
- **Built-in monitoring** - Application Insights
- **Custom domains** - Use your own domain
- **SSL certificates** - Free Let's Encrypt
- **VNet integration** - Connect to private resources

---

## 📚 Documentation Reference

- **Main Guide:** [DEPLOYMENT.md](DEPLOYMENT.md)
- **Checklist:** [AZURE_DEPLOYMENT_CHECKLIST.md](AZURE_DEPLOYMENT_CHECKLIST.md)
- **Azure Connection:** [AZURE_CONNECTION_GUIDE.md](AZURE_CONNECTION_GUIDE.md)
- **Environment Setup:** [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md)
- **Claude Context:** [CLAUDE.md](CLAUDE.md)

---

## 🆘 Getting Help

### Troubleshooting Resources

1. **Check logs:**
   ```bash
   az webapp log tail --name rush-policy-chat --resource-group rg-rush-policy-chat-prod
   ```

2. **Run verification:**
   ```bash
   ./scripts/verify-deployment.sh
   ```

3. **Review checklist:**
   See [AZURE_DEPLOYMENT_CHECKLIST.md](AZURE_DEPLOYMENT_CHECKLIST.md) for common issues

4. **Azure Portal:**
   Visit: https://portal.azure.com → App Services → rush-policy-chat

### Support Links
- **Azure Web Apps Docs:** https://learn.microsoft.com/en-us/azure/app-service/
- **Next.js Deployment:** https://nextjs.org/docs/deployment
- **Managed Identity:** https://learn.microsoft.com/en-us/azure/app-service/overview-managed-identity

---

## ✨ You're Ready to Deploy!

Everything is configured and ready. Choose your deployment method above and follow the steps.

**Recommended for first-time deployment:**

```bash
./scripts/deploy-to-azure.sh
```

Then verify:

```bash
./scripts/verify-deployment.sh
```

Your Rush Policy Chat application will be live in ~25 minutes! 🎉

---

**Last Updated:** January 2025
**Created by:** Claude Code
**For:** Rush University System for Health
