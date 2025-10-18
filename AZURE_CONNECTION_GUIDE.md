# Azure AI Agent Connection Guide

## ✅ Connection Status: WORKING

Your Azure AI Agent is fully configured and operational!

## Quick Start

### 1. Authentication (Already Configured)

You're authenticated via Azure CLI as `Juan_Rojas@rush.edu`. This is the recommended method for local development.

**Current Setup:**
- ✅ Azure CLI: Logged in and working
- ✅ Subscription: RU-Azure-NonProd
- ✅ Tenant: rush.edu
- ✅ Agent: Policy_Tech_V1 (asst_301EhwakRXWsOCgGQt276WiU)

### 2. Environment Configuration

A `.env.local` file has been created with your Azure AI credentials:

```env
AZURE_AI_ENDPOINT=https://rua-nonprod-ai-innovation.services.ai.azure.com/api/projects/rua-nonprod-ai-innovation-project
AZURE_AI_AGENT_ID=asst_301EhwakRXWsOCgGQt276WiU
```

### 3. Test Your Connection

Run the diagnostic script to verify everything is working:

```bash
node scripts/diagnose-azure-connection.js
```

This will test:
- ✅ Azure CLI authentication
- ✅ Environment variable configuration
- ✅ Azure AI Agent connection
- ✅ Full conversation flow

### 4. Run a Sample Conversation

Try the working example:

```bash
node scripts/azure-agent-example.js
```

This demonstrates a complete conversation with your Azure AI Agent.

## Understanding the Code

### Basic Connection Pattern

```javascript
const { AIProjectClient } = require('@azure/ai-projects');
const { DefaultAzureCredential } = require('@azure/identity');

// Initialize client
const project = new AIProjectClient(
  "https://rua-nonprod-ai-innovation.services.ai.azure.com/api/projects/rua-nonprod-ai-innovation-project",
  new DefaultAzureCredential()
);

// Get your agent
const agent = await project.agents.getAgent("asst_301EhwakRXWsOCgGQt276WiU");
console.log(`Connected to: ${agent.name}`);
```

### Complete Conversation Flow

```javascript
// 1. Create a thread (conversation)
const thread = await project.agents.threads.create();

// 2. Send a message
await project.agents.messages.create(
  thread.id,
  "user",
  "What is the HIPAA privacy policy?"
);

// 3. Run the agent
let run = await project.agents.runs.create(thread.id, agent.id);

// 4. Poll for completion
while (run.status === "queued" || run.status === "in_progress") {
  await new Promise(resolve => setTimeout(resolve, 1000));
  run = await project.agents.runs.get(thread.id, run.id);
}

// 5. Get the response
const messages = await project.agents.messages.list(thread.id);
for await (const msg of messages) {
  const content = msg.content.find(c => c.type === "text");
  if (content) {
    console.log(`${msg.role}: ${content.text.value}`);
  }
}
```

## Authentication Methods

### Method 1: Azure CLI (Current - Recommended for Development)

This is what you're using now. It's the simplest for local development.

**Setup:**
```bash
az login
```

**Pros:**
- ✅ Easy setup
- ✅ Secure (uses Azure AD)
- ✅ Works immediately

**Cons:**
- ❌ Requires Azure CLI installed
- ❌ Not suitable for production deployments

### Method 2: Service Principal (Recommended for Production)

For production deployments or CI/CD pipelines.

**Setup:**
1. Create a service principal in Azure Portal
2. Add these to your `.env.local`:
   ```env
   AZURE_TENANT_ID=822ee4ca-eeac-4bf4-957b-97a4bb0b1697
   AZURE_CLIENT_ID=your_client_id
   AZURE_CLIENT_SECRET=your_client_secret
   ```

**Pros:**
- ✅ Works in production
- ✅ Fine-grained permissions
- ✅ Works in CI/CD

**Cons:**
- ❌ Requires more setup
- ❌ Need to manage secrets securely

### Method 3: Managed Identity (For Azure Deployments)

When deploying to Azure App Service, Azure Functions, etc.

**Setup:**
- Enable managed identity on your Azure resource
- No environment variables needed!

**Pros:**
- ✅ Most secure
- ✅ No credentials to manage
- ✅ Azure handles everything

**Cons:**
- ❌ Only works when deployed to Azure
- ❌ Not usable for local development

## How DefaultAzureCredential Works

The `DefaultAzureCredential` tries authentication methods in this order:

1. **Environment Variables** → Checks for `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `AZURE_TENANT_ID`
2. **Managed Identity** → If running on Azure (App Service, Functions, etc.)
3. **Azure CLI** → If you've run `az login` (this is what you're using)
4. **VS Code** → If signed into Azure extension
5. **Azure PowerShell** → If signed into PowerShell

It uses the **first method that works**, making it flexible for different environments.

## Your Current API Routes

### Azure AI Agent Route
**File:** [app/api/azure-agent/route.js](app/api/azure-agent/route.js)

This route is already configured and working:

```javascript
import { AIProjectClient } from '@azure/ai-projects';
import { DefaultAzureCredential } from '@azure/identity';

const project = new AIProjectClient(
  process.env.AZURE_AI_ENDPOINT,
  new DefaultAzureCredential()
);
```

**Test it:**
```bash
npm run dev
# Visit http://localhost:5000
# Toggle to "Azure AI Agent"
```

### OpenAI Assistant Route (Optional)
**File:** [app/api/chat/route.js](app/api/chat/route.js)

This requires separate OpenAI credentials. Not needed if you're using Azure AI Agent.

## Troubleshooting

### Error: "CredentialUnavailableError"

**Cause:** Not authenticated with Azure

**Fix:**
```bash
az login
```

### Error: "Resource not found" (404)

**Cause:** Wrong endpoint or agent ID

**Fix:** Verify in `.env.local`:
- `AZURE_AI_ENDPOINT` matches your Azure AI project URL
- `AZURE_AI_AGENT_ID` exists in your project

### Error: "Permission denied" (403)

**Cause:** Your account lacks permissions

**Fix:** Contact Azure admin to grant "Cognitive Services User" role

### Token Expired

**Cause:** Azure CLI token expired (happens after hours of inactivity)

**Fix:**
```bash
az login --scope https://cognitiveservices.azure.com/.default
```

## Best Practices

### For Development
1. ✅ Use Azure CLI authentication (`az login`)
2. ✅ Keep `.env.local` in `.gitignore`
3. ✅ Use the diagnostic script to test connections
4. ✅ Run `npm run dev` to test in the UI

### For Production
1. ✅ Use Service Principal or Managed Identity
2. ✅ Store secrets in Azure Key Vault or environment variables
3. ✅ Never commit credentials to git
4. ✅ Use separate agents for dev/staging/production
5. ✅ Monitor agent usage and costs

## Next Steps

### 1. Test in Your Application
```bash
npm run dev
```

Visit [http://localhost:5000](http://localhost:5000) and:
- Toggle to "Azure AI Agent"
- Ask: "What is the HIPAA privacy policy?"
- See your agent respond with Rush policy documents!

### 2. Customize the Agent
Your agent (Policy_Tech_V1) is configured in Azure AI Studio:
- Instructions: How the agent should respond
- File Search: Connected to 1300+ PolicyTech documents
- Model: gpt-5-chat-2

### 3. Deploy to Production
When ready to deploy:
1. Choose deployment platform (Replit, Vercel, Azure App Service)
2. Set up production authentication (Service Principal or Managed Identity)
3. Configure environment variables
4. Test thoroughly before going live

## Additional Resources

- **Azure AI Projects SDK**: [Documentation](https://learn.microsoft.com/en-us/azure/ai-studio/)
- **DefaultAzureCredential**: [Authentication Guide](https://learn.microsoft.com/en-us/azure/developer/javascript/sdk/authentication/overview)
- **Project Scripts**:
  - [diagnose-azure-connection.js](scripts/diagnose-azure-connection.js) - Full diagnostic tool
  - [azure-agent-example.js](scripts/azure-agent-example.js) - Working conversation example
  - [test-azure-agent.js](scripts/test-azure-agent.js) - Simple connection test

## Summary

✅ **You're all set!** Your Azure AI Agent is connected and working.

The connection works because:
1. You're authenticated via Azure CLI (`az login`)
2. Environment variables are configured in `.env.local`
3. Your account has proper permissions
4. The agent exists and is accessible

Just run `npm run dev` and start chatting with your Rush policy assistant!

---

**Need Help?**
- Run diagnostics: `node scripts/diagnose-azure-connection.js`
- Check logs in the terminal
- Review error messages (they're designed to be helpful!)
