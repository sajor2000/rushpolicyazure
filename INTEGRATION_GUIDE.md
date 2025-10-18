# Performance Enhancements - Integration Guide

## 🚀 Quick Start

This guide shows how to integrate the new streaming and performance optimizations into the Rush Policy Assistant main component.

---

## Option 1: Quick Integration (Streaming Only)

### Minimal Changes to Enable Streaming

**File**: `app/page.js`

```javascript
'use client';
import { useState, useRef } from 'react';
import { useStreamingResponse } from './hooks/useStreamingResponse';
import SkeletonLoader, { TypingIndicator } from './components/SkeletonLoader';
import StreamingMessage from './components/StreamingMessage';

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');

  // Add streaming hook
  const {
    isStreaming,
    streamingAnswer,
    streamingDocument,
    streamProgress,
    streamStatus,
    startStream,
    cancelStream
  } = useStreamingResponse(
    // onComplete callback
    (response) => {
      setMessages(prev => [...prev, {
        type: 'bot',
        content: response.fullDocument,
        answer: response.answer,
        timestamp: new Date()
      }]);
    },
    // onError callback
    (error) => {
      setMessages(prev => [...prev, {
        type: 'error',
        content: error.message
      }]);
    }
  );

  const sendMessage = async (e, promptText = null) => {
    e?.preventDefault();
    const messageToSend = promptText || inputValue.trim();

    if (!messageToSend) return;

    // Add user message immediately (optimistic UI)
    setMessages(prev => [...prev, {
      type: 'user',
      content: messageToSend,
      timestamp: new Date()
    }]);

    setInputValue('');

    // Start streaming response
    await startStream(messageToSend, messages.length === 0);
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.map((msg, idx) => (
          <div key={idx}>
            {/* Render messages */}
          </div>
        ))}

        {/* Streaming message */}
        {isStreaming && (
          <>
            {streamStatus === 'connecting' && <TypingIndicator />}
            {(streamingAnswer || streamingDocument) && (
              <StreamingMessage
                answer={streamingAnswer}
                fullDocument={streamingDocument}
                isStreamingAnswer={streamStatus === 'answer'}
                isStreamingDocument={streamStatus === 'document'}
                answerProgress={streamProgress.answer}
                documentProgress={streamProgress.document}
              />
            )}
          </>
        )}
      </div>

      {/* Input */}
      <form onSubmit={sendMessage}>
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={isStreaming}
          placeholder="Ask a question..."
        />
        <button type="submit" disabled={isStreaming}>
          {isStreaming ? 'Streaming...' : 'Send'}
        </button>
      </form>
    </div>
  );
}
```

---

## Option 2: Full Integration (Streaming + Caching)

### With SWR Client-Side Caching

```javascript
'use client';
import { useState, useRef, useCallback } from 'react';
import useSWR from 'swr';
import { useStreamingResponse } from './hooks/useStreamingResponse';
import { generateCacheKey, policyFetcher, CACHE_CONFIG } from './utils/cacheManager';
import { PerformanceMetrics } from './utils/performanceMonitor';

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [currentQuery, setCurrentQuery] = useState(null);

  // SWR for caching non-streaming requests (fallback)
  const cacheKey = currentQuery ? generateCacheKey(currentQuery) : null;
  const { data: cachedData, error: cacheError } = useSWR(
    cacheKey,
    () => policyFetcher('/api/azure-agent', { message: currentQuery }),
    {
      ...CACHE_CONFIG,
      revalidateOnFocus: false, // Don't auto-refresh while user is typing
    }
  );

  const {
    isStreaming,
    streamingAnswer,
    streamingDocument,
    startStream
  } = useStreamingResponse(
    (response) => {
      // Complete handler
      setMessages(prev => [...prev, {
        type: 'bot',
        content: response.fullDocument,
        answer: response.answer,
        timestamp: new Date(),
        cached: false
      }]);
    },
    (error) => {
      // Error handler
      console.error('Streaming error:', error);
    }
  );

  const sendMessage = useCallback(async (message) => {
    // Performance tracking
    const metrics = new PerformanceMetrics(`query-${Date.now()}`);
    metrics.mark('request-start');

    // Add user message (optimistic UI)
    setMessages(prev => [...prev, {
      type: 'user',
      content: message,
      timestamp: new Date()
    }]);

    // Check cache first
    const cacheKey = generateCacheKey(message);
    // ... (implement cache check logic)

    // Start streaming for fresh request
    metrics.mark('stream-start');
    await startStream(message);
    metrics.mark('stream-complete');

    metrics.measure('total', 'request-start', 'stream-complete');
    metrics.log();
  }, [startStream]);

  // ... rest of component
}
```

---

## Option 3: Hybrid Approach (Recommended)

### Stream for New Queries, Instant for Cached

```javascript
const sendMessage = async (message) => {
  const cacheKey = generateCacheKey(message);

  // Check if we have a cached response
  const cached = getCachedResponse(cacheKey);

  if (cached && isCacheValid(cached)) {
    // Instant response from cache
    setMessages(prev => [...prev, {
      type: 'bot',
      content: cached.response,
      cached: true,
      timestamp: new Date()
    }]);
    cacheMetrics.recordHit();
  } else {
    // Stream fresh response
    await startStream(message);
    cacheMetrics.recordMiss();
  }
};
```

---

## Testing Streaming

### 1. Test Streaming Endpoint

```bash
# Test the streaming API directly
curl -N -X POST http://localhost:5000/api/azure-agent-stream \
  -H "Content-Type: application/json" \
  -d '{"message": "What are HIPAA requirements?"}'
```

Expected output (SSE format):
```
event: start
data: {"message":"Starting agent run"}

event: answer-chunk
data: {"chunk":"The HIPAA","progress":10,"total":100}

event: answer-complete
data: {"answer":"The HIPAA privacy requirements..."}

event: document-chunk
data: {"chunk":"I. Policy\n","progress":5,"total":200}

event: done
data: {"success":true}
```

### 2. Test Hook in Component

```javascript
// In React component
const TestStreamingButton = () => {
  const { startStream, isStreaming, streamingAnswer } = useStreamingResponse(
    (response) => console.log('Complete:', response),
    (error) => console.error('Error:', error)
  );

  return (
    <div>
      <button
        onClick={() => startStream('Test message')}
        disabled={isStreaming}
      >
        {isStreaming ? 'Streaming...' : 'Test Stream'}
      </button>
      <p>{streamingAnswer}</p>
    </div>
  );
};
```

### 3. Test Performance

```javascript
import { PerformanceMetrics, evaluatePerformance } from './utils/performanceMonitor';

// In your send function
const metrics = new PerformanceMetrics('test-query');

metrics.mark('start');
await startStream(message);
metrics.mark('first-chunk'); // Mark when first chunk arrives
// ... streaming completes ...
metrics.mark('complete');

metrics.measure('ttfb', 'start', 'first-chunk');
metrics.measure('total', 'start', 'complete');

const grade = evaluatePerformance(metrics.getMetrics());
console.log(`Performance: ${grade}`);
metrics.log();
```

---

## Common Integration Patterns

### Pattern 1: Replace Standard API Call

**Before**:
```javascript
const response = await fetch('/api/azure-agent', {
  method: 'POST',
  body: JSON.stringify({ message })
});
const data = await response.json();
setMessages(prev => [...prev, { type: 'bot', content: data.response }]);
```

**After**:
```javascript
const { startStream, isStreaming, streamingAnswer, streamingDocument } = useStreamingResponse(
  (response) => setMessages(prev => [...prev, {
    type: 'bot',
    content: response.fullDocument,
    answer: response.answer
  }])
);

await startStream(message);
```

### Pattern 2: Show Loading State

**Before**:
```javascript
{isLoading && <p>Thinking...</p>}
```

**After**:
```javascript
{isStreaming && streamStatus === 'connecting' && <TypingIndicator />}
{isStreaming && (streamingAnswer || streamingDocument) && (
  <StreamingMessage
    answer={streamingAnswer}
    fullDocument={streamingDocument}
    isStreamingAnswer={streamStatus === 'answer'}
  />
)}
```

### Pattern 3: Handle Errors

**Before**:
```javascript
try {
  const response = await fetch('/api/azure-agent', ...);
  // ...
} catch (error) {
  console.error(error);
}
```

**After**:
```javascript
const { startStream } = useStreamingResponse(
  (response) => {/* success */},
  (error) => {
    setMessages(prev => [...prev, {
      type: 'error',
      content: `Failed to get response: ${error.message}`
    }]);
  }
);
```

---

## Performance Checklist

Before deploying, verify:

- [ ] Streaming endpoint returns SSE events
- [ ] First chunk appears within 500ms
- [ ] Progress bars update smoothly
- [ ] Skeleton loaders show during initial connection
- [ ] Cursor blinks during streaming
- [ ] Cache hits return instantly (<50ms)
- [ ] Cache misses fall back to streaming
- [ ] useMemo prevents unnecessary re-renders
- [ ] Lazy loading only renders when expanded
- [ ] Error states display gracefully

---

## Rollback Plan

If streaming causes issues:

1. **Keep both endpoints**: `/api/azure-agent` (old) and `/api/azure-agent-stream` (new)
2. **Add feature flag**:
   ```javascript
   const USE_STREAMING = process.env.NEXT_PUBLIC_ENABLE_STREAMING === 'true';

   if (USE_STREAMING) {
     await startStream(message);
   } else {
     // Fallback to old implementation
     const response = await fetch('/api/azure-agent', ...);
   }
   ```

3. **Monitor metrics**: Track error rates and performance
4. **Gradual rollout**: Enable for 10% → 50% → 100% of users

---

## Support

### Debug Mode

Enable verbose logging:
```javascript
// In useStreamingResponse.js
const DEBUG = process.env.NODE_ENV === 'development';

if (DEBUG) {
  console.log('Event received:', eventType, eventData);
}
```

### Performance Monitoring

Check metrics in console:
```javascript
import { cacheMetrics } from './utils/cacheManager';

// Get cache statistics
console.log(cacheMetrics.getMetrics());

// Output:
// {
//   hits: 45,
//   misses: 15,
//   hitRate: "75.00%",
//   total: 60
// }
```

---

## Next Steps

After integration:

1. **Test thoroughly** with real Azure AI Agent
2. **Monitor performance** with Performance API
3. **Gather user feedback** on streaming experience
4. **Iterate on chunk sizes** for optimal UX
5. **Add analytics** to track adoption and satisfaction

---

**Last Updated**: 2025-10-18
**Status**: Ready for Integration
