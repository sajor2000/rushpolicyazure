/**
 * Test: TB Policy Query
 * Run with: node scripts/test-tb-policy.js
 */

const { AIProjectClient } = require('@azure/ai-projects');
const { DefaultAzureCredential } = require('@azure/identity');
require('dotenv').config({ path: '.env.local' });

async function testTBPolicy() {
  console.log('\n🏥 Testing Rush TB Policy Query...\n');

  const project = new AIProjectClient(
    process.env.AZURE_AI_ENDPOINT ||
    "https://rua-nonprod-ai-innovation.services.ai.azure.com/api/projects/rua-nonprod-ai-innovation-project",
    new DefaultAzureCredential()
  );

  const agentId = process.env.AZURE_AI_AGENT_ID || "asst_301EhwakRXWsOCgGQt276WiU";

  try {
    // Get agent
    const agent = await project.agents.getAgent(agentId);
    console.log(`✅ Connected to: ${agent.name}\n`);

    // Create thread
    const thread = await project.agents.threads.create();
    console.log(`📝 Thread created: ${thread.id}\n`);

    // Send the TB policy question
    const question = "What is TB policy?";
    console.log(`❓ Question: "${question}"\n`);

    await project.agents.messages.create(thread.id, "user", question);

    // Run the agent
    console.log('⚙️  Processing...');
    let run = await project.agents.runs.create(thread.id, agent.id);

    let iterations = 0;
    while (run.status === "queued" || run.status === "in_progress") {
      await new Promise(resolve => setTimeout(resolve, 1000));
      run = await project.agents.runs.get(thread.id, run.id);
      iterations++;

      if (iterations % 3 === 0) {
        process.stdout.write('.');
      }
    }

    console.log('\n');

    if (run.status === "failed") {
      console.error('❌ Run failed:', run.lastError);
      return;
    }

    console.log(`✅ Response received!\n`);

    // Get messages
    const messages = await project.agents.messages.list(thread.id, { order: "asc" });

    console.log('═══════════════════════════════════════════════════════════');
    console.log('                    TB POLICY RESPONSE                     ');
    console.log('═══════════════════════════════════════════════════════════\n');

    for await (const msg of messages) {
      if (msg.role === 'assistant') {
        const content = msg.content.find(c => c.type === "text" && "text" in c);
        if (content) {
          console.log(content.text.value);
        }
      }
    }

    console.log('\n═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    throw error;
  }
}

testTBPolicy().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
