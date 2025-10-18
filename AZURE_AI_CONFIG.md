# Azure AI Agent Configuration

## Environment Variables Required

Create a `.env.local` file in the root directory with the following variables:

```bash
# Azure AI Configuration
AZURE_AI_ENDPOINT=https://rua-nonprod-ai-innovation.services.ai.azure.com/api/projects/rua-nonprod-ai-innovation-project
AZURE_AI_AGENT_ID=asst_301EhwakRXWsOCgGQt276WiU

# Azure OpenAI Configuration (existing)
AZURE_OPENAI_API_KEY=your_azure_openai_api_key_here
AZURE_OPENAI_ENDPOINT=your_azure_openai_endpoint_here
ASSISTANT_ID=your_assistant_id_here
```

## Azure Authentication

The application uses `DefaultAzureCredential` for authentication, which supports:

1. **Environment Variables**: Set `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, and `AZURE_TENANT_ID`
2. **Managed Identity**: When running on Azure
3. **Azure CLI**: When running locally with `az login`
4. **Visual Studio Code**: When using the Azure extension

## API Endpoints

- **Original OpenAI Assistant**: `/api/chat` - Uses the existing OpenAI assistant
- **New Azure AI Agent**: `/api/azure-agent` - Uses the new Azure AI agent

## Usage

The Azure AI agent endpoint accepts the same request format as the original chat endpoint:

```javascript
const response = await fetch('/api/azure-agent', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: 'Your question here',
    resetConversation: false // optional
  })
});
```

## Features

- **Thread Management**: Maintains conversation context across requests
- **Error Handling**: Comprehensive error handling for Azure-specific issues
- **Authentication**: Automatic credential management
- **Response Format**: Maintains the same response format as the original assistant
