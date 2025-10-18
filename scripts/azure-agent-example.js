/**
 * Azure AI Agent - Working Conversation Example
 * Run with: node scripts/azure-agent-example.js
 *
 * This is a complete working example based on your code that successfully connects
 * to the Azure AI Agent and runs a conversation.
 */

const { AIProjectClient } = require('@azure/ai-projects');
const { DefaultAzureCredential } = require('@azure/identity');
require('dotenv').config({ path: '.env.local' });

async function runAgentConversation() {
  console.log('🚀 Starting Azure AI Agent conversation...\n');

  // Initialize the Azure AI Project client
  const project = new AIProjectClient(
    process.env.AZURE_AI_ENDPOINT ||
    "https://rua-nonprod-ai-innovation.services.ai.azure.com/api/projects/rua-nonprod-ai-innovation-project",
    new DefaultAzureCredential()
  );

  const agentId = process.env.AZURE_AI_AGENT_ID || "asst_301EhwakRXWsOCgGQt276WiU";

  try {
    // Step 1: Get the agent details
    console.log('📡 Connecting to Azure AI Agent...');
    const agent = await project.agents.getAgent(agentId);
    console.log(`✅ Retrieved agent: ${agent.name}`);
    console.log(`   Model: ${agent.model}\n`);

    // Step 2: Create a conversation thread
    console.log('📝 Creating conversation thread...');
    const thread = await project.agents.threads.create();
    console.log(`✅ Created thread, ID: ${thread.id}\n`);

    // Step 3: Send a message to the agent
    const userMessage = "What is the HIPAA privacy policy for Rush University Medical Center?";
    console.log(`💬 Sending message: "${userMessage}"`);

    const message = await project.agents.messages.create(
      thread.id,
      "user",
      userMessage
    );
    console.log(`✅ Created message, ID: ${message.id}\n`);

    // Step 4: Create and run the agent
    console.log('⚙️  Creating run...');
    let run = await project.agents.runs.create(thread.id, agent.id);
    console.log(`   Run ID: ${run.id}`);
    console.log(`   Initial status: ${run.status}`);

    // Step 5: Poll until the run reaches a terminal status
    console.log('\n⏳ Waiting for agent response...');
    let pollCount = 0;
    while (run.status === "queued" || run.status === "in_progress") {
      // Wait for a second
      await new Promise((resolve) => setTimeout(resolve, 1000));
      run = await project.agents.runs.get(thread.id, run.id);
      pollCount++;

      // Show progress every 5 seconds
      if (pollCount % 5 === 0) {
        console.log(`   Still processing... (${pollCount}s)`);
      }
    }

    // Step 6: Check for errors
    if (run.status === "failed") {
      console.error('\n❌ Run failed:', run.lastError);
      return;
    }

    console.log(`\n✅ Run completed with status: ${run.status}`);

    // Step 7: Retrieve and display messages
    console.log('\n📥 Retrieving conversation messages...\n');
    const messages = await project.agents.messages.list(thread.id, { order: "asc" });

    console.log('═══════════════════════════════════════════════════════════');
    console.log('                    CONVERSATION TRANSCRIPT                ');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Display messages
    for await (const m of messages) {
      const content = m.content.find((c) => c.type === "text" && "text" in c);
      if (content) {
        const role = m.role === 'user' ? '👤 USER' : '🤖 ASSISTANT';
        const divider = m.role === 'user' ? '─'.repeat(60) : '═'.repeat(60);

        console.log(divider);
        console.log(`${role}:`);
        console.log(divider);
        console.log(content.text.value);
        console.log('');
      }
    }

    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('✅ Conversation completed successfully!\n');

  } catch (error) {
    console.error("\n❌ An error occurred:", error.message);

    // Provide helpful error messages
    if (error.code === 'CredentialUnavailableError') {
      console.error('\n💡 Authentication failed. Please run "az login" or set environment variables:');
      console.error('   - AZURE_CLIENT_ID');
      console.error('   - AZURE_CLIENT_SECRET');
      console.error('   - AZURE_TENANT_ID\n');
    } else if (error.statusCode === 404) {
      console.error('\n💡 Resource not found. Please check:');
      console.error('   - AZURE_AI_ENDPOINT is correct');
      console.error('   - AZURE_AI_AGENT_ID exists in your Azure AI project\n');
    } else if (error.statusCode === 403) {
      console.error('\n💡 Permission denied. Your account needs:');
      console.error('   - "Cognitive Services User" role or higher');
      console.error('   - Access to the Azure AI resource\n');
    }

    console.error('\nFull error details:');
    console.error(error);
  }
}

// Main execution
console.log('\n╔════════════════════════════════════════════════╗');
console.log('║    Azure AI Agent - Rush Policy Assistant     ║');
console.log('╚════════════════════════════════════════════════╝\n');

runAgentConversation().catch(error => {
  console.error("Fatal error:", error);
  process.exit(1);
});
