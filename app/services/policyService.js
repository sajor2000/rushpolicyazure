/**
 * Policy Service
 *
 * Centralized service for all policy-related API calls.
 * Handles communication with the Azure AI Agent backend.
 */

/**
 * Send a message to the policy chat agent
 * @param {string} message - User's question
 * @param {boolean} resetConversation - Whether to reset the conversation thread
 * @returns {Promise<Object>} Response from the agent
 * @throws {Error} If the request fails or returns invalid data
 */
export async function sendPolicyQuestion(message, resetConversation = false) {
  if (!message || typeof message !== 'string') {
    throw new Error('Message must be a non-empty string');
  }

  const response = await fetch('/api/azure-agent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: message.trim(),
      resetConversation,
    }),
  });

  // Parse JSON with proper error handling
  let data;
  try {
    data = await response.json();
  } catch (jsonError) {
    console.error('JSON parse error:', jsonError);
    throw new Error('Invalid response from server. The policy data may contain formatting issues.');
  }

  // Handle HTTP errors
  if (!response.ok) {
    const errorMessage = data.details || data.error || `HTTP error! status: ${response.status}`;
    throw new Error(errorMessage);
  }

  // Validate response structure
  if (!data.response) {
    throw new Error('Invalid response format from server');
  }

  return data;
}

/**
 * Reset the current conversation thread
 * @returns {Promise<Object>} Confirmation response
 */
export async function resetConversation() {
  const response = await fetch('/api/reset', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to reset conversation');
  }

  return response.json();
}

/**
 * Check API health status
 * @returns {Promise<Object>} Health status
 */
export async function checkHealthStatus() {
  const response = await fetch('/api/health');

  if (!response.ok) {
    throw new Error('Health check failed');
  }

  return response.json();
}
