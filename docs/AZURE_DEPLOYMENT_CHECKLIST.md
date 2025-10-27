# Azure Deployment Checklist

Comprehensive pre-deployment and post-deployment checklist for Rush Policy Chat Assistant on Azure App Service.

---

## Pre-Deployment Checklist

### 1. Local Development Verification

- [ ] **Node.js version 18.0.0 or higher installed**
  ```bash
  node --version  # Should be >= 18.0.0
  ```

- [ ] **Dependencies installed successfully**
  ```bash
  npm install
  # Verify no errors
  ```

- [ ] **Application builds without errors**
  ```bash
  npm run build
  # Check for successful build completion
  # Verify .next/standalone/ directory created
  ```

- [ ] **Application runs locally**
  ```bash
  npm run start:azure
  # Visit http://localhost:3000
  # Test basic functionality
  ```

- [ ] **Azure AI Agent connection works locally**
  ```bash
  node scripts/test-azure-agent.js
  # Expected: "✅ Azure AI Agent test completed successfully!"
  ```

### 2. Environment Configuration

- [ ] **`.env.local` configured correctly**
  - [ ] `AZURE_AI_ENDPOINT` set to correct endpoint
  - [ ] `AZURE_AI_AGENT_ID` set to `asst_301EhwakRXWsOCgGQt276WiU`
  - [ ] Azure credentials configured (if not using Managed Identity)

- [ ] **Azure CLI installed and authenticated**
  ```bash
  az --version
  az login
  az account show
  ```

- [ ] **Correct Azure subscription selected**
  ```bash
  az account list --output table
  az account set --subscription "Your-Subscription-Name"
  ```

### 3. Azure Resources Preparation

- [ ] **Resource Group created**
  ```bash
  az group create --name rush-policy-chat-rg --location "East US"
  ```

- [ ] **App Service Plan created**
  ```bash
  az appservice plan create \
    --name rush-policy-plan \
    --resource-group rush-policy-chat-rg \
    --sku B1 \
    --is-linux
  ```

- [ ] **Web App created**
  ```bash
  az webapp create \
    --resource-group rush-policy-chat-rg \
    --plan rush-policy-plan \
    --name rush-policy-chat-app \
    --runtime "NODE|18-lts"
  ```

### 4. Application Configuration

- [ ] **Environment variables set in Azure**
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

- [ ] **Startup command configured**
  ```bash
  az webapp config set \
    --resource-group rush-policy-chat-rg \
    --name rush-policy-chat-app \
    --startup-file "node .next/standalone/server.js"
  ```

- [ ] **HTTPS enforcement enabled**
  ```bash
  az webapp update \
    --resource-group rush-policy-chat-rg \
    --name rush-policy-chat-app \
    --https-only true
  ```

- [ ] **Managed Identity enabled** (Recommended)
  ```bash
  az webapp identity assign \
    --resource-group rush-policy-chat-rg \
    --name rush-policy-chat-app
  ```

- [ ] **Managed Identity permissions granted**
  - Contact Azure admin to assign "Cognitive Services User" role
  - Verify permissions for Azure AI Project access

### 5. Security Configuration

- [ ] **HTTP 2.0 enabled**
  ```bash
  az webapp config set \
    --resource-group rush-policy-chat-rg \
    --name rush-policy-chat-app \
    --http20-enabled true
  ```

- [ ] **Minimum TLS version set to 1.2**
  ```bash
  az webapp config set \
    --resource-group rush-policy-chat-rg \
    --name rush-policy-chat-app \
    --min-tls-version 1.2
  ```

- [ ] **Application logging enabled**
  ```bash
  az webapp log config \
    --resource-group rush-policy-chat-rg \
    --name rush-policy-chat-app \
    --application-logging filesystem \
    --level information
  ```

### 6. Code Preparation

- [ ] **All changes committed to git**
  ```bash
  git status  # Should show "working tree clean"
  ```

- [ ] **Build artifacts excluded from git** (already in .gitignore)
  - `.next/` directory
  - `node_modules/`
  - `.env.local`

- [ ] **package.json has postbuild script**
  ```json
  "postbuild": "cp -r public .next/standalone/ 2>/dev/null || true && cp -r .next/static .next/standalone/.next/ 2>/dev/null || true"
  ```

### 7. Deployment Method Selection

Choose one deployment method:

- [ ] **Option A: Local Git Deployment** (Testing)
  - [ ] Local git deployment configured
  - [ ] Azure remote added to git

- [ ] **Option B: GitHub Actions** (Production - Recommended)
  - [ ] GitHub repository connected
  - [ ] GitHub Actions workflow file exists
  - [ ] Secrets configured in GitHub

- [ ] **Option C: Azure DevOps**
  - [ ] Pipeline YAML created
  - [ ] Service connection configured

- [ ] **Option D: ZIP Deployment** (Quick Deploy)
  - [ ] Build completed locally
  - [ ] ZIP file prepared

---

## Deployment Execution

### During Deployment

- [ ] **Deployment initiated**
  - Record deployment start time: _______________
  - Deployment method used: _______________

- [ ] **Deployment logs monitored**
  ```bash
  az webapp log tail \
    --resource-group rush-policy-chat-rg \
    --name rush-policy-chat-app
  ```

- [ ] **No errors in deployment logs**
  - Build successful
  - Dependencies installed
  - postbuild script executed

- [ ] **Deployment completed successfully**
  - Record deployment end time: _______________
  - Total deployment duration: _______________

---

## Post-Deployment Verification

### 1. Application Status

- [ ] **App Service is running**
  ```bash
  az webapp show \
    --resource-group rush-policy-chat-rg \
    --name rush-policy-chat-app \
    --query state
  # Expected: "Running"
  ```

- [ ] **Health endpoint responds**
  ```bash
  curl https://rush-policy-chat-app.azurewebsites.net/api/health
  # Expected: {"status":"ok","message":"Rush Policy Chat Assistant is running",...}
  ```

### 2. Functional Testing

- [ ] **Home page loads successfully**
  - Visit: `https://rush-policy-chat-app.azurewebsites.net`
  - Verify Rush branding displays correctly
  - Check for console errors (F12)

- [ ] **Azure AI Agent connection works**
  ```bash
  curl -X POST https://rush-policy-chat-app.azurewebsites.net/api/azure-agent \
    -H "Content-Type: application/json" \
    -d '{"message":"What is the tuberculosis exposure policy?"}'
  # Should return policy information
  ```

- [ ] **Test query from browser**
  - Ask: "What is the tuberculosis exposure policy?"
  - Verify response within 30 seconds
  - Check for ANSWER and FULL_POLICY_DOCUMENT sections
  - Verify citations appear in response

- [ ] **Copy functionality works**
  - Click "Copy Answer" button
  - Verify toast notification appears
  - Paste in text editor to verify clipboard

- [ ] **Suggested prompts work**
  - Click on a suggested prompt
  - Verify it populates the input field
  - Verify it submits automatically

- [ ] **Clear conversation works**
  - Click "Clear" button
  - Verify conversation history clears
  - Verify input field clears

### 3. Performance Verification

- [ ] **Response time acceptable**
  - First query: < 30 seconds
  - Subsequent queries: < 30 seconds
  - Page load time: < 3 seconds

- [ ] **Static assets load correctly**
  - CSS styles applied
  - Fonts loaded (Montserrat, Source Sans 3, Georgia)
  - Icons displayed (Lucide icons)

- [ ] **No 404 errors for static files**
  - Check browser console (F12)
  - Check for missing JS/CSS files

### 4. Security Verification

- [ ] **HTTPS enforced**
  - Visit: `http://rush-policy-chat-app.azurewebsites.net`
  - Verify redirect to HTTPS

- [ ] **Security headers present**
  ```bash
  curl -I https://rush-policy-chat-app.azurewebsites.net
  # Check for:
  # - Strict-Transport-Security
  # - X-Content-Type-Options: nosniff
  # - X-Frame-Options: DENY
  # - Content-Security-Policy
  ```

- [ ] **Rate limiting functional**
  - Send 21 requests rapidly (exceeds 20/min limit)
  - Verify 429 error received on 21st request

- [ ] **Input sanitization working**
  - Try input with control characters
  - Verify they're removed/escaped

### 5. Monitoring Configuration

- [ ] **Application Insights enabled** (Optional but recommended)
  ```bash
  az webapp config appsettings list \
    --resource-group rush-policy-chat-rg \
    --name rush-policy-chat-app \
    --query "[?name=='APPINSIGHTS_INSTRUMENTATIONKEY']"
  ```

- [ ] **Health check monitoring enabled**
  ```bash
  az webapp config show \
    --resource-group rush-policy-chat-rg \
    --name rush-policy-chat-app \
    --query healthCheckPath
  # Should return: "/api/health"
  ```

- [ ] **Auto-scaling configured** (Production only)
  ```bash
  az monitor autoscale show \
    --resource-group rush-policy-chat-rg \
    --name rush-policy-autoscale
  ```

### 6. Log Review

- [ ] **Application logs show successful startup**
  ```bash
  az webapp log tail \
    --resource-group rush-policy-chat-rg \
    --name rush-policy-chat-app
  ```
  Look for:
  - ✅ No startup errors
  - ✅ "Fresh thread created" messages
  - ✅ "RAG VALIDATION" messages
  - ✅ "Thread cleaned up" messages

- [ ] **No authentication errors**
  - No 401 errors in logs
  - No "DefaultAzureCredential failed" messages
  - Managed Identity working correctly

- [ ] **No Azure connection errors**
  - No "ENOTFOUND" errors
  - No "Azure connection failed" messages

### 7. RAG Accuracy Verification

- [ ] **Citations present in responses**
  - Test query returns citations
  - Citations marked with 【source†file.pdf】 format

- [ ] **Two-part structure present**
  - ANSWER section exists
  - FULL_POLICY_DOCUMENT section exists

- [ ] **No hallucination warnings in logs**
  ```bash
  az webapp log tail \
    --resource-group rush-policy-chat-rg \
    --name rush-policy-chat-app | grep "RAG WARNING"
  # Should see minimal or no warnings
  ```

---

## Production-Only Configuration

For production deployments, complete these additional items:

### 1. Custom Domain

- [ ] **Custom domain configured**
  ```bash
  az webapp config hostname add \
    --resource-group rush-policy-chat-rg \
    --webapp-name rush-policy-chat-app \
    --hostname policy-chat.rush.edu
  ```

- [ ] **SSL certificate bound**
  ```bash
  az webapp config ssl bind \
    --resource-group rush-policy-chat-rg \
    --name rush-policy-chat-app \
    --certificate-thumbprint <thumbprint> \
    --ssl-type SNI
  ```

- [ ] **ALLOWED_ORIGIN updated**
  ```bash
  az webapp config appsettings set \
    --resource-group rush-policy-chat-rg \
    --name rush-policy-chat-app \
    --settings ALLOWED_ORIGIN="https://policy-chat.rush.edu"
  ```

### 2. Application Insights

- [ ] **Application Insights created**
- [ ] **Instrumentation key configured**
- [ ] **Custom dashboards created**
- [ ] **Alerts configured** for:
  - High error rate
  - Slow response times
  - High CPU/memory usage
  - Authentication failures

### 3. Auto-Scaling

- [ ] **Autoscale rules configured**
  - Scale out when CPU > 70%
  - Scale in when CPU < 30%
  - Min instances: 1
  - Max instances: 5

### 4. Backup Configuration

- [ ] **Storage account created for backups**
- [ ] **Automated backup configured**
  - Frequency: Daily
  - Retention: 30 days

### 5. Access Control

- [ ] **Azure AD authentication enabled** (Optional)
- [ ] **RBAC permissions configured**
- [ ] **IP restrictions configured** (if needed)

---

## Troubleshooting Quick Reference

If issues occur, check these items in order:

1. **Application won't start**
   - Verify startup command: `node .next/standalone/server.js`
   - Check Node version: NODE|18-lts
   - Review application logs

2. **Azure AI Agent connection fails**
   - Verify environment variables set
   - Check Managed Identity enabled and has permissions
   - Test from SSH: `node scripts/test-azure-agent.js`

3. **Static files not loading**
   - Verify postbuild script ran
   - Check deployment logs for "cp -r public"
   - Manually copy if needed

4. **Slow response times**
   - Check Application Insights for bottlenecks
   - Verify Azure AI service status
   - Consider scaling up

5. **Rate limiting too aggressive**
   - Adjust RATE_LIMIT in app/constants.js
   - Redeploy application

---

## Post-Deployment Communication

### Internal Team Notification

Send to stakeholders:

```
Subject: Rush Policy Chat Assistant - Azure Deployment Complete

The Rush Policy Chat Assistant has been successfully deployed to Azure App Service.

Production URL: https://rush-policy-chat-app.azurewebsites.net
[or custom domain: https://policy-chat.rush.edu]

Deployment Details:
- Date/Time: [deployment timestamp]
- Environment: Production
- Version: 1.0.0
- Status: ✅ All systems operational

Testing Completed:
✅ Health endpoint responding
✅ Azure AI Agent connectivity verified
✅ Functional testing passed
✅ Security headers configured
✅ HTTPS enforced
✅ Monitoring enabled

Key Features:
- Query 1300+ PolicyTech documents
- Zero-hallucination RAG architecture
- WCAG AA accessibility compliant
- Rush University brand compliance
- Rate limiting: 20 requests/min per IP

Support Contact: [your contact info]
Documentation: docs/AZURE_DEPLOYMENT.md
```

### User Announcement

Send to end users:

```
Subject: New Tool: Rush Policy Chat Assistant Now Available

We're excited to announce the Rush Policy Chat Assistant, a new AI-powered tool to help you quickly find answers to policy questions.

Access: https://policy-chat.rush.edu

Features:
- Instant answers from 1300+ official PolicyTech documents
- Ask questions in plain English
- Verbatim policy quotes with citations
- Copy answers for easy reference

Example Questions:
- "What is the tuberculosis exposure policy?"
- "How do I request time off?"
- "What are the guidelines for patient safety?"

Support: [IT help desk contact]
Training: [link to training materials if available]
```

---

## Rollback Plan

If critical issues occur, follow this rollback procedure:

1. **Stop the application**
   ```bash
   az webapp stop \
     --resource-group rush-policy-chat-rg \
     --name rush-policy-chat-app
   ```

2. **Deploy previous version** (if using deployment slots)
   ```bash
   az webapp deployment slot swap \
     --resource-group rush-policy-chat-rg \
     --name rush-policy-chat-app \
     --slot staging \
     --target-slot production
   ```

3. **Or redeploy last known good commit**
   ```bash
   git checkout <previous-working-commit>
   git push azure main --force
   ```

4. **Notify stakeholders**

5. **Investigate issue** before attempting redeployment

---

## Maintenance Schedule

Regular maintenance tasks:

- **Daily**: Review Application Insights for errors
- **Weekly**: Check resource usage and costs
- **Monthly**: Review security updates (`npm audit`)
- **Quarterly**: Review and update dependencies
- **Annually**: Review and renew SSL certificates

---

## Sign-Off

Deployment completed by: ___________________________

Date: ___________________________

Verified by: ___________________________

Date: ___________________________

Approved for production: ___________________________

Date: ___________________________

---

**Document Version**: 1.0
**Last Updated**: January 2025
**Next Review**: [3 months from deployment]
