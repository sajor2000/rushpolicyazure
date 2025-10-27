
# Replit Deployment Guide

This guide explains how to deploy the Rush Policy Chat Assistant on Replit for both development and production use.

## 🚀 Quick Deployment on Replit

### Step 1: Environment Variables Setup

1. **Access Replit Secrets**
   - Click on the "Secrets" tab in the sidebar (lock icon)
   - Add the following environment variables:

```
AZURE_AI_ENDPOINT=https://rua-nonprod-ai-innovation.services.ai.azure.com/api/projects/rua-nonprod-ai-innovation-project
AZURE_AI_AGENT_ID=asst_301EhwakRXWsOCgGQt276WiU

# Optional: Azure Authentication (if not using Managed Identity)
# AZURE_CLIENT_ID=your-client-id
# AZURE_CLIENT_SECRET=your-client-secret
# AZURE_TENANT_ID=your-tenant-id
```

### Step 2: Development Testing

1. **Run the application**
   ```bash
   npm run dev
   ```
   
2. **Test the environment**
   - Visit `/api/health` to check application health
   - Run `node scripts/test-azure-agent.js` to test Azure AI Agent connection

### Step 3: Production Deployment

1. **Click the Deploy button** at the top right of your Replit workspace

2. **Choose Autoscale Deployment** for production-grade scaling

3. **Configure deployment settings**:
   - **Build command**: `npm run build`
   - **Run command**: `npm start`
   - **Machine configuration**: 1vCPU, 2 GiB RAM (default)
   - **Max machines**: 3 (adjust based on expected traffic)

4. **Set your custom domain** (optional but recommended for production)

### Step 4: Environment Variables in Deployment

Replit automatically transfers your Secrets to the deployment, but verify:

1. In the Deployments tab, check "Environment Variables"
2. Ensure all required variables are present:
   - `AZURE_AI_ENDPOINT`
   - `AZURE_AI_AGENT_ID`
   - `NODE_ENV` (set to "production")

## 🔧 Configuration Details

### Port Configuration

The application is configured to use port 3000, which Replit automatically forwards:

- **Development**: `http://localhost:3000`
- **Production**: Your custom Replit domain

### Environment Loading

The app automatically loads environment variables from:
1. Replit Secrets (recommended for production)
2. `.env.local` file (for local development only)

### Build Process

1. **Development**: Hot reloading with `npm run dev`
2. **Production**: Optimized build with `npm run build` → `npm start`

## 🛡️ Security Best Practices

### Secrets Management

- ✅ Use Replit Secrets for all sensitive data
- ✅ Never commit API keys to Git
- ✅ Regularly rotate API keys
- ✅ Monitor access logs

### Network Security

- ✅ HTTPS is automatically enabled on Replit deployments
- ✅ Environment variables are encrypted at rest
- ✅ API endpoints include rate limiting

## 📊 Monitoring & Debugging

### Health Checks

- **Application Health**: `/api/health`
- **Environment Check**: `/api/test-env`
- **Connection Test**: `/api/debug`

### Logs

Access deployment logs in the Replit Deployments tab:
1. Click on your deployment
2. View "Logs" tab for real-time application logs
3. Check "Analytics" for performance metrics

### Common Issues

1. **Environment Variables Not Loading**
   - Verify Secrets are set correctly
   - Check variable names match exactly
   - Redeploy after adding new secrets

2. **Azure AI Agent Connection Issues**
   - Test with `node scripts/test-azure-agent.js`
   - Verify Azure credentials (run `az login` locally)
   - Check endpoint URL includes `/api/projects/...`
   - Verify Agent ID is correct

3. **Build Failures**
   - Check Node.js version compatibility (18+)
   - Verify all dependencies are installed
   - Review build logs in Deployments tab

## 🔄 Updating Your Deployment

1. **Make code changes** in your Replit workspace
2. **Test locally** with the Run button
3. **Redeploy** by clicking "Redeploy" in the Deployments tab

Replit automatically rebuilds and redeploys your application.

## 💰 Cost Optimization

### Replit Pricing

- **Development**: Free with Replit Core
- **Autoscale Deployment**: Pay-per-use scaling
- **Outbound Data Transfer**: $0.10/GiB (100 GiB free with Core)

### Optimization Tips

- Use appropriate machine sizing
- Configure auto-scaling limits
- Monitor usage in the Analytics tab
- Cache responses when appropriate

## 🆚 Replit vs Azure Comparison

| Feature | Replit | Azure App Service |
|---------|--------|-------------------|
| **Ease of Setup** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Scaling** | Auto-scaling | Manual + Auto-scaling |
| **Cost (Small Apps)** | Lower | Higher |
| **Enterprise Features** | Basic | Advanced |
| **Global CDN** | Included | Available |
| **Custom Domains** | ✅ | ✅ |

## 📞 Support

For Replit-specific deployment issues:
- [Replit Discord Community](https://discord.gg/replit)
- [Replit Documentation](https://docs.replit.com)
- [Replit Support](https://support.replit.com)

---

**Recommendation**: Use Replit for development, testing, and small-to-medium production deployments. Consider Azure for enterprise-scale deployments with advanced compliance requirements.
