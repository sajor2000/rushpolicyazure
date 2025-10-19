/**
 * Test script for Azure AI Agent connection
 * Run with: node scripts/test-azure-agent.js
 */

const { AIProjectClient } = require('@azure/ai-projects');
const { DefaultAzureCredential } = require('@azure/identity');

async function testAzureAgent() {
  try {
    console.log('Testing Azure AI Agent connection...');
    
    // Initialize the client
    const project = new AIProjectClient(
      process.env.AZURE_AI_ENDPOINT || "https://rua-nonprod-ai-innovation.services.ai.azure.com/api/projects/rua-nonprod-ai-innovation-project",
      new DefaultAzureCredential()
    );

    const agentId = process.env.AZURE_AI_AGENT_ID || "asst_301EhwakRXWsOCgGQt276WiU";
    
    console.log('Retrieving agent...');
    const agent = await project.agents.getAgent(agentId);
    console.log(`Retrieved agent: ${agent.name}`);
    
    console.log('Creating thread...');
    const thread = await project.agents.threads.create();
    console.log(`Created thread, ID: ${thread.id}`);

    console.log('Sending message...');
    const message = await project.agents.messages.create(thread.id, "user", "Hi Policy_Tech_V1");
    console.log(`Created message, ID: ${message.id}`);

    console.log('Creating run...');
    let run = await project.agents.runs.create(thread.id, agent.id);

    // Poll until the run reaches a terminal status
    while (run.status === "queued" || run.status === "in_progress") {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      run = await project.agents.runs.get(thread.id, run.id);
    }

    if (run.status === "failed") {
      console.error(`Run failed: ${run.lastError}`);
      return;
    }

    console.log(`Run completed with status: ${run.status}`);

    console.log('Retrieving messages...');
    const messages = await project.agents.messages.list(thread.id, { order: "asc" });

    console.log('\n--- Conversation ---');
    for await (const m of messages) {
      const content = m.content.find((c) => c.type === "text" && "text" in c);
      if (content) {
        console.log(`${m.role}: ${content.text.value}`);
      }
    }

    console.log('\n✅ Azure AI Agent test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
    
    if (error.message.includes('ENOTFOUND')) {
      console.error('💡 Hint: Check your network connection and Azure endpoint URL');
    } else if (error.status === 401) {
      console.error('💡 Hint: Check your Azure credentials (AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_TENANT_ID)');
    } else if (error.message.includes('DefaultAzureCredential')) {
      console.error('💡 Hint: Make sure you have Azure credentials configured (az login or environment variables)');
    }
  }
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });

testAzureAgent();
