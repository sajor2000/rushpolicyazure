# Azure Web Apps Deployment Checklist

Quick pre-flight checklist before deploying Rush Policy Chat to Azure Web Apps.

---

## Pre-Deployment Checklist

### ✅ Azure Prerequisites

- [ ] **Azure CLI installed** - Run `az --version` to verify
- [ ] **Logged in to Azure** - Run `az login`
- [ ] **Correct subscription** - Run `az account show` to confirm
- [ ] **Sufficient permissions** - Can create resources and assign roles
- [ ] **Access to Azure AI resource** - Can view `rua-nonprod-ai-innovation` resource

### ✅ Local Environment

- [ ] **Node.js 18+ installed** - Run `node --version`
- [ ] **npm installed** - Run `npm --version`
- [ ] **Dependencies installed** - Run `npm install`
- [ ] **Application builds successfully** - Run `npm run build`
- [ ] **Application runs locally** - Run `npm run dev` and test at http://localhost:3000

### ✅ Application Configuration

- [ ] **Azure AI endpoint verified** - Check `.env.local` for correct endpoint
- [ ] **Azure AI agent ID verified** - Check `.env.local` for correct agent ID
- [ ] **Next.js standalone mode** - Verify `next.config.js` has `output: 'standalone'`
- [ ] **Startup script exists** - Check `startup.sh` file exists
- [ ] **Package.json scripts** - Verify `start:azure` script exists

### ✅ Azure Resources (if pre-existing)

- [ ] **Resource group name** - Know your target resource group
- [ ] **App Service plan SKU** - Decide on B1, S1, or P1v3
- [ ] **Web app name available** - Check if name is available globally
- [ ] **Azure region** - Choose region (e.g., eastus, centralus)

### ✅ Network & Security

- [ ] **Firewall rules** - Azure AI allows access from Azure services
- [ ] **IP restrictions** (optional) - Decide if restricting to Rush network
- [ ] **Custom domain** (optional) - Have domain ready if using one
- [ ] **SSL certificate** (optional) - Prepare if using custom domain

### ✅ GitHub (for CI/CD - Optional)

- [ ] **Code pushed to GitHub** - Repository up to date
- [ ] **GitHub Actions enabled** - Repository has Actions enabled
- [ ] **Secrets access** - Can add repository secrets

---

## Deployment Methods - Choose One

### Method 1: Automated Script (Recommended)

**Best for:** First-time deployment, testing

```bash
chmod +x scripts/deploy-to-azure.sh
./scripts/deploy-to-azure.sh
```

**Time:** ~25 minutes
**Skill level:** Beginner

---

### Method 2: GitHub Actions CI/CD

**Best for:** Production deployments, team collaboration

**Steps:**
1. Get publish profile:
   ```bash
   az webapp deployment list-publishing-profiles \
     --name rush-policy-chat \
     --resource-group rg-rush-policy-chat-prod \
     --xml
   ```

2. Add to GitHub Secrets:
   - Go to repo → Settings → Secrets and variables → Actions
   - Add secret: `AZURE_WEBAPP_PUBLISH_PROFILE`
   - Paste the XML from step 1

3. Push to main branch:
   ```bash
   git add .
   git commit -m "Deploy to Azure"
   git push origin main
   ```

**Time:** ~15 minutes (after first setup)
**Skill level:** Intermediate

---

### Method 3: Manual Azure CLI

**Best for:** Advanced users, custom configurations

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed step-by-step instructions.

**Time:** ~35 minutes
**Skill level:** Advanced

---

## Post-Deployment Verification

### Run Verification Script

```bash
chmod +x scripts/verify-deployment.sh
./scripts/verify-deployment.sh rush-policy-chat rg-rush-policy-chat-prod
```

### Manual Verification

- [ ] **Web app accessible** - Visit `https://rush-policy-chat.azurewebsites.net`
- [ ] **Homepage loads** - No errors on initial page load
- [ ] **Ask a test question** - Try: "What is the HIPAA privacy policy?"
- [ ] **Response received** - Get answer from PolicyTech
- [ ] **PDF formatting** - Response displays in professional PDF format
- [ ] **No console errors** - Check browser developer console

### Check Logs

```bash
# Live tail logs
az webapp log tail \
  --name rush-policy-chat \
  --resource-group rg-rush-policy-chat-prod

# Download logs
az webapp log download \
  --name rush-policy-chat \
  --resource-group rg-rush-policy-chat-prod \
  --log-file app-logs.zip
```

---

## Common Issues & Solutions

### Issue: "Managed Identity not working"

**Symptoms:** Authentication errors, "CredentialUnavailableError"

**Solution:**
```bash
# Re-enable managed identity
az webapp identity assign \
  --name rush-policy-chat \
  --resource-group rg-rush-policy-chat-prod

# Re-assign role (wait 30 seconds after enabling identity)
PRINCIPAL_ID=$(az webapp identity show \
  --name rush-policy-chat \
  --resource-group rg-rush-policy-chat-prod \
  --query principalId -o tsv)

az role assignment create \
  --assignee $PRINCIPAL_ID \
  --role "Cognitive Services User" \
  --scope /subscriptions/YOUR_SUBSCRIPTION/resourceGroups/rua-nonprod-ai-innovation/providers/Microsoft.CognitiveServices/accounts/rua-nonprod-ai-innovation
```

---

### Issue: "Application failed to start"

**Symptoms:** 503 errors, "Application Error" page

**Solutions:**
1. Check startup command:
   ```bash
   az webapp config show \
     --name rush-policy-chat \
     --resource-group rg-rush-policy-chat-prod \
     --query startupFile
   ```

2. Verify build succeeded:
   ```bash
   az webapp log tail --name rush-policy-chat --resource-group rg-rush-policy-chat-prod
   ```

3. Restart app:
   ```bash
   az webapp restart \
     --name rush-policy-chat \
     --resource-group rg-rush-policy-chat-prod
   ```

---

### Issue: "Module not found"

**Symptoms:** Error logs show missing dependencies

**Solution:** Ensure standalone build is being used:
1. Check `next.config.js` has `output: 'standalone'`
2. Rebuild: `npm run build`
3. Redeploy

---

### Issue: "Cannot reach Azure AI endpoint"

**Symptoms:** Network errors, timeout errors

**Solutions:**
1. Check firewall rules:
   ```bash
   az cognitiveservices account show \
     --name rua-nonprod-ai-innovation \
     --resource-group rua-nonprod-ai-innovation \
     --query properties.networkAcls
   ```

2. Verify endpoint URL in app settings:
   ```bash
   az webapp config appsettings list \
     --name rush-policy-chat \
     --resource-group rg-rush-policy-chat-prod \
     --query "[?name=='AZURE_AI_ENDPOINT']"
   ```

---

## Environment-Specific Settings

### Development/Testing (B1 Tier)
- **SKU:** B1 ($13/month)
- **Instances:** 1
- **Use for:** Testing, demos
- **Logging:** Verbose (information level)

### Production (S1 Tier)
- **SKU:** S1 ($70/month)
- **Instances:** 1-3 with auto-scale
- **Use for:** Internal employee access
- **Logging:** Warning level
- **Monitoring:** Application Insights enabled
- **Security:** IP restrictions to Rush network

### Enterprise (P1v3 Tier)
- **SKU:** P1v3 ($150/month)
- **Instances:** 2-10 with auto-scale
- **Use for:** High traffic, VNet integration needed
- **Features:** All production features + VNet

---

## Quick Reference Commands

```bash
# View app status
az webapp show --name rush-policy-chat --resource-group rg-rush-policy-chat-prod --query state

# Restart app
az webapp restart --name rush-policy-chat --resource-group rg-rush-policy-chat-prod

# View logs
az webapp log tail --name rush-policy-chat --resource-group rg-rush-policy-chat-prod

# Update environment variable
az webapp config appsettings set \
  --name rush-policy-chat \
  --resource-group rg-rush-policy-chat-prod \
  --settings KEY=VALUE

# Stop app
az webapp stop --name rush-policy-chat --resource-group rg-rush-policy-chat-prod

# Start app
az webapp start --name rush-policy-chat --resource-group rg-rush-policy-chat-prod

# Scale up
az appservice plan update \
  --name asp-rush-policy-chat \
  --resource-group rg-rush-policy-chat-prod \
  --sku S1

# Scale out (add instances)
az appservice plan update \
  --name asp-rush-policy-chat \
  --resource-group rg-rush-policy-chat-prod \
  --number-of-workers 3
```

---

## Support Resources

- **Azure Web Apps Docs:** https://learn.microsoft.com/en-us/azure/app-service/
- **Managed Identity:** https://learn.microsoft.com/en-us/azure/app-service/overview-managed-identity
- **Next.js Deployment:** https://nextjs.org/docs/deployment
- **Azure AI Projects:** https://learn.microsoft.com/en-us/azure/ai-studio/

---

## Deployment Timeline

| Phase | Estimated Time |
|-------|---------------|
| Pre-flight checks | 5 minutes |
| Azure resource creation | 10 minutes |
| Build application | 3-5 minutes |
| Deploy code | 5 minutes |
| Verification | 3-5 minutes |
| **Total** | **~25-35 minutes** |

---

## Sign-off Checklist

Before considering deployment complete:

- [ ] All verification tests pass
- [ ] Application accessible via HTTPS
- [ ] Test query returns policy document
- [ ] No errors in logs (first 5 minutes)
- [ ] Managed Identity permissions verified
- [ ] Monitoring/alerts configured (production only)
- [ ] Team notified of new deployment
- [ ] Documentation updated with app URL

---

**Last Updated:** January 2025
**For Questions:** Contact IT Support or Azure Administrator
