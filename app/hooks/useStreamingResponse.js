import { useState, useCallback, useRef } from 'react';

/**
 * Custom hook for handling Server-Sent Events (SSE) streaming responses
 * from the Azure AI Agent API
 *
 * @param {Function} onComplete - Callback when streaming completes successfully
 * @param {Function} onError - Callback when an error occurs
 * @returns {Object} Streaming state and control functions
 */
export function useStreamingResponse(onComplete, onError) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingAnswer, setStreamingAnswer] = useState('');
  const [streamingDocument, setStreamingDocument] = useState('');
  const [streamProgress, setStreamProgress] = useState({ answer: 0, document: 0 });
  const [streamStatus, setStreamStatus] = useState('idle'); // idle, connecting, answer, document, complete, error

  const eventSourceRef = useRef(null);
  const abortControllerRef = useRef(null);

  /**
   * Cancel ongoing stream
   */
  const cancelStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setStreamStatus('idle');
  }, []);

  /**
   * Start streaming a response
   *
   * @param {string} message - User message to send
   * @param {boolean} resetConversation - Whether to reset the conversation thread
   */
  const startStream = useCallback(async (message, resetConversation = false) => {
    // Cancel any existing stream
    cancelStream();

    // Reset state
    setStreamingAnswer('');
    setStreamingDocument('');
    setStreamProgress({ answer: 0, document: 0 });
    setStreamStatus('connecting');
    setIsStreaming(true);

    try {
      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController();

      // Make POST request to streaming endpoint
      const response = await fetch('/api/azure-agent-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, resetConversation }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Create reader for streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      // Process stream
      while (true) {
        const { value, done } = await reader.read();

        if (done) {
          break;
        }

        // Decode chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE messages
        const messages = buffer.split('\n\n');
        buffer = messages.pop() || ''; // Keep incomplete message in buffer

        for (const message of messages) {
          if (!message.trim()) continue;

          // Parse SSE message
          const lines = message.split('\n');
          let eventType = 'message';
          let eventData = null;

          for (const line of lines) {
            if (line.startsWith('event:')) {
              eventType = line.substring(6).trim();
            } else if (line.startsWith('data:')) {
              const dataStr = line.substring(5).trim();
              try {
                eventData = JSON.parse(dataStr);
              } catch (e) {
                console.error('Failed to parse SSE data:', dataStr);
              }
            }
          }

          // Handle different event types
          if (!eventData) continue;

          switch (eventType) {
            case 'start':
              console.log('Stream started:', eventData);
              setStreamStatus('connecting');
              break;

            case 'run-created':
              console.log('Run created:', eventData);
              break;

            case 'status-update':
              console.log('Status update:', eventData);
              break;

            case 'heartbeat':
              // Keep connection alive
              break;

            case 'answer-start':
              console.log('Answer streaming starting');
              setStreamStatus('answer');
              break;

            case 'answer-chunk':
              setStreamingAnswer(prev => prev + eventData.chunk);
              setStreamProgress(prev => ({
                ...prev,
                answer: Math.round((eventData.progress / eventData.total) * 100)
              }));
              break;

            case 'answer-complete':
              console.log('Answer complete');
              setStreamingAnswer(eventData.answer);
              setStreamProgress(prev => ({ ...prev, answer: 100 }));
              break;

            case 'document-start':
              console.log('Document streaming starting');
              setStreamStatus('document');
              break;

            case 'document-chunk':
              setStreamingDocument(prev => prev + eventData.chunk);
              setStreamProgress(prev => ({
                ...prev,
                document: Math.round((eventData.progress / eventData.total) * 100)
              }));
              break;

            case 'document-complete':
              console.log('Document complete');
              setStreamingDocument(eventData.fullDocument);
              setStreamProgress(prev => ({ ...prev, document: 100 }));
              break;

            case 'done':
              console.log('Stream complete:', eventData);
              setStreamStatus('complete');
              setIsStreaming(false);

              if (onComplete) {
                onComplete({
                  answer: eventData.answer || streamingAnswer,
                  fullDocument: eventData.fullDocument || streamingDocument
                });
              }
              break;

            case 'error':
              console.error('Stream error:', eventData);
              setStreamStatus('error');
              setIsStreaming(false);

              if (onError) {
                onError(new Error(eventData.error || 'Unknown streaming error'));
              }
              break;

            default:
              console.log('Unknown event type:', eventType, eventData);
          }
        }
      }

    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Stream cancelled by user');
        setStreamStatus('idle');
      } else {
        console.error('Streaming error:', error);
        setStreamStatus('error');
        if (onError) {
          onError(error);
        }
      }
      setIsStreaming(false);
    } finally {
      abortControllerRef.current = null;
    }
  }, [cancelStream, onComplete, onError, streamingAnswer, streamingDocument]);

  return {
    // State
    isStreaming,
    streamingAnswer,
    streamingDocument,
    streamProgress,
    streamStatus,

    // Actions
    startStream,
    cancelStream,
  };
}
