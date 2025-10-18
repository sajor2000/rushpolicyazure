/**
 * Comprehensive Azure AI Agent Connection Diagnostic Tool
 * Run with: node scripts/diagnose-azure-connection.js
 *
 * This script tests various authentication methods and provides detailed diagnostics
 */

const { AIProjectClient } = require('@azure/ai-projects');
const { DefaultAzureCredential, AzureCliCredential, EnvironmentCredential } = require('@azure/identity');
require('dotenv').config({ path: '.env.local' });

// ANSI color codes for better readability
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

async function testAzureCliAuth() {
  log(colors.cyan, '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log(colors.cyan, '  Step 1: Testing Azure CLI Authentication');
  log(colors.cyan, '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    const credential = new AzureCliCredential();
    const token = await credential.getToken('https://cognitiveservices.azure.com/.default');

    log(colors.green, '✅ Azure CLI authentication: SUCCESS');
    log(colors.blue, '   Token obtained, expires:', new Date(token.expiresOnTimestamp).toLocaleString());
    return true;
  } catch (error) {
    log(colors.red, '❌ Azure CLI authentication: FAILED');
    log(colors.yellow, '   Error:', error.message);
    log(colors.yellow, '\n   💡 Fix: Run "az login" in your terminal');
    return false;
  }
}

async function testEnvironmentAuth() {
  log(colors.cyan, '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log(colors.cyan, '  Step 2: Testing Environment Variable Auth');
  log(colors.cyan, '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const hasClientId = !!process.env.AZURE_CLIENT_ID;
  const hasClientSecret = !!process.env.AZURE_CLIENT_SECRET;
  const hasTenantId = !!process.env.AZURE_TENANT_ID;

  log(colors.blue, 'Environment variables check:');
  log(hasClientId ? colors.green : colors.yellow, `   AZURE_CLIENT_ID: ${hasClientId ? 'SET' : 'NOT SET'}`);
  log(hasClientSecret ? colors.green : colors.yellow, `   AZURE_CLIENT_SECRET: ${hasClientSecret ? 'SET' : 'NOT SET'}`);
  log(hasTenantId ? colors.green : colors.yellow, `   AZURE_TENANT_ID: ${hasTenantId ? 'SET' : 'NOT SET'}`);

  if (hasClientId && hasClientSecret && hasTenantId) {
    try {
      const credential = new EnvironmentCredential();
      const token = await credential.getToken('https://cognitiveservices.azure.com/.default');

      log(colors.green, '\n✅ Environment credential authentication: SUCCESS');
      log(colors.blue, '   Token obtained, expires:', new Date(token.expiresOnTimestamp).toLocaleString());
      return true;
    } catch (error) {
      log(colors.red, '\n❌ Environment credential authentication: FAILED');
      log(colors.yellow, '   Error:', error.message);
      return false;
    }
  } else {
    log(colors.yellow, '\n⚠️  Environment credentials not configured (using Azure CLI instead)');
    return false;
  }
}

async function testAgentConnection() {
  log(colors.cyan, '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log(colors.cyan, '  Step 3: Testing Azure AI Agent Connection');
  log(colors.cyan, '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const endpoint = process.env.AZURE_AI_ENDPOINT ||
    'https://rua-nonprod-ai-innovation.services.ai.azure.com/api/projects/rua-nonprod-ai-innovation-project';
  const agentId = process.env.AZURE_AI_AGENT_ID || 'asst_301EhwakRXWsOCgGQt276WiU';

  log(colors.blue, 'Configuration:');
  log(colors.blue, '   Endpoint:', endpoint);
  log(colors.blue, '   Agent ID:', agentId);

  try {
    log(colors.blue, '\n🔐 Creating DefaultAzureCredential...');
    const credential = new DefaultAzureCredential();

    log(colors.blue, '📞 Initializing AIProjectClient...');
    const project = new AIProjectClient(endpoint, credential);

    log(colors.blue, '🤖 Retrieving agent...');
    const agent = await project.agents.getAgent(agentId);

    log(colors.green, '\n✅ Agent connection: SUCCESS!\n');
    log(colors.green, '   Agent Name:', agent.name);
    log(colors.green, '   Agent ID:', agent.id);
    log(colors.green, '   Model:', agent.model);
    log(colors.green, '   Instructions:', agent.instructions?.substring(0, 100) + '...');

    return { success: true, project, agentId };
  } catch (error) {
    log(colors.red, '\n❌ Agent connection: FAILED\n');
    log(colors.yellow, '   Error message:', error.message);

    if (error.statusCode) {
      log(colors.yellow, '   HTTP Status:', error.statusCode);

      if (error.statusCode === 401) {
        log(colors.yellow, '\n   💡 Fix: Authentication failed. Try:');
        log(colors.yellow, '      1. Run "az login"');
        log(colors.yellow, '      2. Or set AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_TENANT_ID');
      } else if (error.statusCode === 403) {
        log(colors.yellow, '\n   💡 Fix: Permission denied. Your account needs:');
        log(colors.yellow, '      - "Cognitive Services User" role or higher');
        log(colors.yellow, '      - Access to the Azure AI resource');
      } else if (error.statusCode === 404) {
        log(colors.yellow, '\n   💡 Fix: Resource not found. Check:');
        log(colors.yellow, '      - Endpoint URL is correct');
        log(colors.yellow, '      - Agent ID exists in your Azure AI project');
      }
    }

    if (error.code) {
      log(colors.yellow, '   Error code:', error.code);
    }

    log(colors.yellow, '\n   Full error details:');
    console.error(error);

    return { success: false };
  }
}

async function testFullConversation(project, agentId) {
  log(colors.cyan, '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log(colors.cyan, '  Step 4: Testing Full Conversation Flow');
  log(colors.cyan, '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    log(colors.blue, '📝 Creating conversation thread...');
    const thread = await project.agents.threads.create();
    log(colors.green, `✅ Thread created: ${thread.id}`);

    log(colors.blue, '\n💬 Sending test message...');
    const message = await project.agents.messages.create(
      thread.id,
      'user',
      'Hello! Can you confirm you can access Rush policy documents?'
    );
    log(colors.green, `✅ Message created: ${message.id}`);

    log(colors.blue, '\n⚙️  Creating run...');
    let run = await project.agents.runs.create(thread.id, agentId);
    log(colors.blue, `   Run ID: ${run.id}`);
    log(colors.blue, `   Status: ${run.status}`);

    log(colors.blue, '\n⏳ Waiting for response...');
    let iterations = 0;
    const maxIterations = 60; // 60 seconds timeout

    while (run.status === 'queued' || run.status === 'in_progress') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      run = await project.agents.runs.get(thread.id, run.id);
      iterations++;

      if (iterations % 5 === 0) {
        log(colors.blue, `   Still waiting... (${iterations}s) Status: ${run.status}`);
      }

      if (iterations >= maxIterations) {
        log(colors.yellow, '\n⚠️  Timeout: Response took too long');
        return false;
      }
    }

    if (run.status === 'failed') {
      log(colors.red, '\n❌ Run failed:', run.lastError?.message || 'Unknown error');
      return false;
    }

    log(colors.green, `\n✅ Run completed with status: ${run.status}`);

    log(colors.blue, '\n📥 Retrieving messages...');
    const messages = await project.agents.messages.list(thread.id, { order: 'asc' });

    log(colors.green, '\n✅ Full conversation test: SUCCESS!\n');
    log(colors.cyan, '━━━ Conversation ━━━');

    for await (const msg of messages) {
      const content = msg.content.find(c => c.type === 'text' && 'text' in c);
      if (content) {
        const role = msg.role === 'user' ? '👤 User' : '🤖 Assistant';
        log(msg.role === 'user' ? colors.blue : colors.green, `\n${role}:`);
        console.log(content.text.value.substring(0, 200) + (content.text.value.length > 200 ? '...' : ''));
      }
    }

    log(colors.cyan, '\n━━━━━━━━━━━━━━━━━━━━');

    return true;
  } catch (error) {
    log(colors.red, '\n❌ Conversation test: FAILED');
    log(colors.yellow, '   Error:', error.message);
    console.error(error);
    return false;
  }
}

async function main() {
  log(colors.cyan, '\n╔════════════════════════════════════════════════╗');
  log(colors.cyan, '║  Azure AI Agent Connection Diagnostic Tool    ║');
  log(colors.cyan, '╚════════════════════════════════════════════════╝');

  // Test 1: Azure CLI
  const cliAuthWorks = await testAzureCliAuth();

  // Test 2: Environment variables
  const envAuthWorks = await testEnvironmentAuth();

  // Test 3: Agent connection
  const agentResult = await testAgentConnection();

  // Test 4: Full conversation (only if agent connection works)
  if (agentResult.success) {
    await testFullConversation(agentResult.project, agentResult.agentId);
  }

  // Summary
  log(colors.cyan, '\n╔════════════════════════════════════════════════╗');
  log(colors.cyan, '║              Diagnostic Summary                ║');
  log(colors.cyan, '╚════════════════════════════════════════════════╝\n');

  log(cliAuthWorks ? colors.green : colors.red,
    `${cliAuthWorks ? '✅' : '❌'} Azure CLI Authentication`);
  log(envAuthWorks ? colors.green : colors.yellow,
    `${envAuthWorks ? '✅' : '⚠️ '} Environment Variable Authentication`);
  log(agentResult.success ? colors.green : colors.red,
    `${agentResult.success ? '✅' : '❌'} Azure AI Agent Connection`);

  if (agentResult.success) {
    log(colors.green, '\n🎉 All systems operational! Your Azure AI Agent is ready to use.');
    log(colors.blue, '\nNext steps:');
    log(colors.blue, '   1. Run "npm run dev" to start the development server');
    log(colors.blue, '   2. Toggle to "Azure AI Agent" in the UI');
    log(colors.blue, '   3. Start asking questions about Rush policies!');
  } else {
    log(colors.yellow, '\n⚠️  Connection issues detected. Please review the error messages above.');
  }

  console.log('');
}

// Run the diagnostic
main().catch(error => {
  log(colors.red, '\n💥 Unexpected error occurred:');
  console.error(error);
  process.exit(1);
});
