
# Azure Deployment Guide

This guide explains how to deploy the Rush Policy Chat Assistant to Azure App Service and configure it for production use.

## Prerequisites

- Azure subscription
- Azure CLI installed locally
- Git repository (GitHub/Azure DevOps)
- Azure OpenAI resource configured

## Deployment Options

### Option 1: Azure App Service (Recommended)

#### Step 1: Create Azure App Service

```bash
# Login to Azure
az login

# Create resource group
az group create --name rush-policy-chat-rg --location "East US"

# Create App Service Plan
az appservice plan create --name rush-policy-plan --resource-group rush-policy-chat-rg --sku B1 --is-linux

# Create Web App
az webapp create --resource-group rush-policy-chat-rg --plan rush-policy-plan --name rush-policy-chat-app --runtime "NODE|18-lts"
```

#### Step 2: Configure Application Settings

```bash
# Set environment variables
az webapp config appsettings set --resource-group rush-policy-chat-rg --name rush-policy-chat-app --settings \
  AZURE_OPENAI_ENDPOINT="https://your-resource.openai.azure.com/" \
  AZURE_OPENAI_API_KEY="your-api-key" \
  ASSISTANT_ID="asst_your_assistant_id" \
  VECTOR_STORE_ID="vs_your_vector_store_id" \
  NODE_ENV="production"
```

#### Step 3: Deploy from Git Repository

```bash
# Configure deployment from GitHub
az webapp deployment source config --resource-group rush-policy-chat-rg --name rush-policy-chat-app --repo-url https://github.com/your-username/rush-policy-chat --branch main --manual-integration

# Or configure local git deployment
az webapp deployment source config-local-git --resource-group rush-policy-chat-rg --name rush-policy-chat-app
```

#### Step 4: Configure Startup Command

```bash
# Set startup command for Next.js
az webapp config set --resource-group rush-policy-chat-rg --name rush-policy-chat-app --startup-file "npm start"
```

### Option 2: Azure Container Instances

#### Step 1: Create Dockerfile

Create a Dockerfile in the root directory:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
```

#### Step 2: Build and Deploy Container

```bash
# Build container image
az acr build --registry your-registry --image rush-policy-chat:latest .

# Deploy to Container Instances
az container create \
  --resource-group rush-policy-chat-rg \
  --name rush-policy-chat \
  --image your-registry.azurecr.io/rush-policy-chat:latest \
  --cpu 1 \
  --memory 2 \
  --registry-login-server your-registry.azurecr.io \
  --registry-username your-username \
  --registry-password your-password \
  --environment-variables \
    AZURE_OPENAI_ENDPOINT="https://your-resource.openai.azure.com/" \
    AZURE_OPENAI_API_KEY="your-api-key" \
    ASSISTANT_ID="asst_your_assistant_id" \
    VECTOR_STORE_ID="vs_your_vector_store_id" \
    NODE_ENV="production"
```

## Security Configuration

### 1. Configure Custom Domain and SSL

```bash
# Add custom domain
az webapp config hostname add --resource-group rush-policy-chat-rg --webapp-name rush-policy-chat-app --hostname your-domain.com

# Enable HTTPS only
az webapp update --resource-group rush-policy-chat-rg --name rush-policy-chat-app --https-only true
```

### 2. Configure Authentication (Azure AD)

```bash
# Enable Azure AD authentication
az webapp auth update --resource-group rush-policy-chat-rg --name rush-policy-chat-app \
  --enabled true \
  --action LoginWithAzureActiveDirectory \
  --aad-client-id your-client-id \
  --aad-client-secret your-client-secret \
  --aad-tenant-id your-tenant-id
```

### 3. Configure Application Insights

```bash
# Create Application Insights
az monitor app-insights component create --app rush-policy-insights --location "East US" --resource-group rush-policy-chat-rg

# Get instrumentation key
INSTRUMENTATION_KEY=$(az monitor app-insights component show --app rush-policy-insights --resource-group rush-policy-chat-rg --query instrumentationKey -o tsv)

# Configure app to use Application Insights
az webapp config appsettings set --resource-group rush-policy-chat-rg --name rush-policy-chat-app --settings \
  APPINSIGHTS_INSTRUMENTATIONKEY="$INSTRUMENTATION_KEY"
```

## Production Checklist

- [ ] Environment variables configured securely
- [ ] HTTPS enabled and HTTP redirected
- [ ] Custom domain configured
- [ ] Azure AD authentication enabled
- [ ] Application Insights monitoring enabled
- [ ] Backup and disaster recovery configured
- [ ] Access controls and RBAC configured
- [ ] Security scanning enabled
- [ ] Health check endpoints configured

## Monitoring and Logging

### Application Insights Queries

```kusto
// Application errors
exceptions
| where timestamp > ago(24h)
| summarize count() by type, outerMessage
| order by count_ desc

// Request performance
requests
| where timestamp > ago(24h)
| summarize avg(duration), count() by name
| order by avg_duration desc

// Custom events (chat interactions)
customEvents
| where name == "ChatMessage"
| where timestamp > ago(24h)
| summarize count() by bin(timestamp, 1h)
```

### Health Check Endpoint

The application includes a health check endpoint at `/api/health` that can be used with Azure's health monitoring:

```bash
# Configure health check
az webapp config set --resource-group rush-policy-chat-rg --name rush-policy-chat-app --generic-configurations '{"healthCheckPath": "/api/health"}'
```

## Scaling Configuration

### Auto-scaling Rules

```bash
# Create auto-scale profile
az monitor autoscale create \
  --resource-group rush-policy-chat-rg \
  --resource rush-policy-chat-app \
  --resource-type Microsoft.Web/sites \
  --name rush-policy-autoscale \
  --min-count 1 \
  --max-count 3 \
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

## Troubleshooting

### Common Issues

1. **Application won't start**
   - Check application logs: `az webapp log tail --resource-group rush-policy-chat-rg --name rush-policy-chat-app`
   - Verify environment variables are set correctly
   - Check Node.js version compatibility

2. **OpenAI connection issues**
   - Verify API key and endpoint in application settings
   - Check network security groups and firewall rules
   - Test connection using `/api/debug` endpoint

3. **Performance issues**
   - Monitor Application Insights for slow requests
   - Check App Service Plan scaling
   - Review database query performance

### Useful Commands

```bash
# View application logs
az webapp log tail --resource-group rush-policy-chat-rg --name rush-policy-chat-app

# Restart application
az webapp restart --resource-group rush-policy-chat-rg --name rush-policy-chat-app

# View configuration
az webapp config show --resource-group rush-policy-chat-rg --name rush-policy-chat-app

# SSH into app service
az webapp ssh --resource-group rush-policy-chat-rg --name rush-policy-chat-app
```

## Cost Optimization

- Use appropriate App Service Plan tier (B1 for development, S1+ for production)
- Configure auto-scaling to handle traffic spikes efficiently
- Monitor Azure OpenAI usage and costs
- Use Azure Cost Management for budget alerts

For support with Azure deployment, contact the Azure support team or consult the [Azure App Service documentation](https://docs.microsoft.com/en-us/azure/app-service/).
