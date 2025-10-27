// ⚠️ DEPRECATED: This script is for the legacy Azure OpenAI Assistants API
// ⚠️ The application now uses Azure AI Agent (not Azure OpenAI)
// ⚠️ Use scripts/test-azure-agent.js instead for testing the current setup
//
// This file is kept as a reference example only.

import { AzureOpenAI } from 'openai';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const client = new AzureOpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  endpoint: process.env.AZURE_OPENAI_ENDPOINT,
  apiVersion: "2024-05-01-preview"
});

async function testAssistant() {
  try {
    console.log('🔄 Creating thread...');
    const thread = await client.beta.threads.create();
    console.log('✅ Thread created:', thread.id);

    console.log('📝 Sending test message...');
    await client.beta.threads.messages.create(thread.id, {
      role: "user",
      content: "What is the cystic fibrosis policy?"
    });

    console.log('🏃 Running assistant...');
    const run = await client.beta.threads.runs.create(thread.id, {
      assistant_id: process.env.ASSISTANT_ID
    });

    // Wait for completion
    let runStatus = await client.beta.threads.runs.retrieve(thread.id, run.id);
    
    while (runStatus.status === 'queued' || runStatus.status === 'in_progress') {
      console.log('⏳ Status:', runStatus.status);
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await client.beta.threads.runs.retrieve(thread.id, run.id);
    }

    if (runStatus.status === 'completed') {
      console.log('✅ Run completed!');
      
      // Get the response
      const messages = await client.beta.threads.messages.list(thread.id);
      const assistantMessage = messages.data.find(m => m.role === 'assistant');
      
      console.log('\n📋 ASSISTANT RESPONSE:');
      console.log('------------------------');
      console.log(assistantMessage.content[0].text.value);
      console.log('------------------------\n');
      
      console.log('🎉 Test successful! Your assistant is working correctly.');
    } else {
      console.error('❌ Run failed with status:', runStatus.status);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n🔍 Check that:');
    console.log('1. Your API key is correct');
    console.log('2. Your endpoint URL is correct');
    console.log('3. Your assistant ID is correct');
    console.log('4. Your Azure OpenAI resource has the gpt-4o-2 model deployed');
  }
}

// Run the test
console.log('🧪 Testing Rush Policy Assistant...\n');
testAssistant();