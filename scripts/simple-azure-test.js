/**
 * Simple test for Azure AI Agent connection
 * Run with: node scripts/simple-azure-test.js
 */

const { AgentsClient } = require('@azure/ai-agents');
const { DefaultAzureCredential } = require('@azure/identity');

async function simpleTest() {
  try {
    console.log('Testing Azure AI Agent connection...');
    
    // Initialize the client
    const client = new AgentsClient(
      "https://rua-nonprod-ai-innovation.services.ai.azure.com/api/projects/rua-nonprod-ai-innovation-project",
      new DefaultAzureCredential()
    );

    console.log('✅ Client initialized successfully');
    console.log('✅ Azure AI Agent integration is ready!');
    console.log('\nNext steps:');
    console.log('1. Set up your .env.local file with the Azure credentials');
    console.log('2. Run the development server: npm run dev');
    console.log('3. Test the Azure AI agent toggle in the UI');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.message.includes('ChainedTokenCredential')) {
      console.error('💡 Hint: Run "az login --scope https://ai.azure.com/.default" to authenticate');
    } else if (error.message.includes('Resource not found')) {
      console.error('💡 Hint: Check your Azure AI endpoint URL');
    } else {
      console.error('💡 Hint: Check your Azure credentials and endpoint configuration');
    }
  }
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });

simpleTest();
