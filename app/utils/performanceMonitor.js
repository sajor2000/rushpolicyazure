/**
 * Performance Monitoring Utility
 *
 * Tracks key performance metrics for the Rush Policy Assistant
 * Helps identify bottlenecks and measure optimization impact
 */

/**
 * Performance metrics class for tracking streaming responses
 */
export class PerformanceMetrics {
  constructor(queryId) {
    this.queryId = queryId;
    this.marks = {};
    this.measures = {};
    this.startTime = performance.now();
  }

  /**
   * Mark a specific point in time
   * @param {string} name - Name of the mark
   */
  mark(name) {
    this.marks[name] = performance.now() - this.startTime;
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(`${this.queryId}-${name}`);
    }
  }

  /**
   * Measure duration between two marks
   * @param {string} name - Name of the measurement
   * @param {string} startMark - Starting mark name
   * @param {string} endMark - Ending mark name (optional, defaults to now)
   */
  measure(name, startMark, endMark = null) {
    const start = this.marks[startMark];
    const end = endMark ? this.marks[endMark] : (performance.now() - this.startTime);

    if (start !== undefined) {
      this.measures[name] = end - start;
    }
  }

  /**
   * Get all metrics
   * @returns {Object} All performance metrics
   */
  getMetrics() {
    return {
      queryId: this.queryId,
      marks: { ...this.marks },
      measures: { ...this.measures },
      totalTime: performance.now() - this.startTime,
    };
  }

  /**
   * Log metrics to console (development only)
   */
  log() {
    if (process.env.NODE_ENV === 'development') {
      console.group(`📊 Performance Metrics: ${this.queryId}`);
      console.table(this.measures);
      console.groupEnd();
    }
  }
}

/**
 * Calculate Time to First Byte (TTFB)
 * @param {number} requestStart - Request start timestamp
 * @param {number} responseStart - Response start timestamp
 * @returns {number} TTFB in milliseconds
 */
export function calculateTTFB(requestStart, responseStart) {
  return responseStart - requestStart;
}

/**
 * Calculate Time to First Token (for streaming)
 * @param {number} streamStart - Stream start timestamp
 * @param {number} firstChunkTime - First chunk received timestamp
 * @returns {number} TTFT in milliseconds
 */
export function calculateTTFT(streamStart, firstChunkTime) {
  return firstChunkTime - streamStart;
}

/**
 * Track cache hit rate
 */
class CacheMetricsTracker {
  constructor() {
    this.hits = 0;
    this.misses = 0;
    this.errors = 0;
  }

  recordHit() {
    this.hits++;
  }

  recordMiss() {
    this.misses++;
  }

  recordError() {
    this.errors++;
  }

  getHitRate() {
    const total = this.hits + this.misses;
    return total > 0 ? (this.hits / total) * 100 : 0;
  }

  getMetrics() {
    return {
      hits: this.hits,
      misses: this.misses,
      errors: this.errors,
      hitRate: this.getHitRate().toFixed(2) + '%',
      total: this.hits + this.misses + this.errors,
    };
  }

  reset() {
    this.hits = 0;
    this.misses = 0;
    this.errors = 0;
  }
}

// Global cache metrics instance
export const cacheMetrics = new CacheMetricsTracker();

/**
 * Performance thresholds (in milliseconds)
 */
export const PERFORMANCE_THRESHOLDS = {
  EXCELLENT: {
    TTFB: 200,
    TTFT: 500,
    TOTAL: 2000,
  },
  GOOD: {
    TTFB: 500,
    TTFT: 1000,
    TOTAL: 4000,
  },
  ACCEPTABLE: {
    TTFB: 1000,
    TTFT: 2000,
    TOTAL: 8000,
  },
};

/**
 * Evaluate performance grade based on metrics
 * @param {Object} metrics - Performance metrics object
 * @returns {string} Performance grade: 'excellent', 'good', 'acceptable', or 'poor'
 */
export function evaluatePerformance(metrics) {
  const { measures } = metrics;

  const ttfb = measures.ttfb || Infinity;
  const ttft = measures.ttft || Infinity;
  const total = measures.total || Infinity;

  if (
    ttfb <= PERFORMANCE_THRESHOLDS.EXCELLENT.TTFB &&
    ttft <= PERFORMANCE_THRESHOLDS.EXCELLENT.TTFT &&
    total <= PERFORMANCE_THRESHOLDS.EXCELLENT.TOTAL
  ) {
    return 'excellent';
  }

  if (
    ttfb <= PERFORMANCE_THRESHOLDS.GOOD.TTFB &&
    ttft <= PERFORMANCE_THRESHOLDS.GOOD.TTFT &&
    total <= PERFORMANCE_THRESHOLDS.GOOD.TOTAL
  ) {
    return 'good';
  }

  if (
    ttfb <= PERFORMANCE_THRESHOLDS.ACCEPTABLE.TTFB &&
    ttft <= PERFORMANCE_THRESHOLDS.ACCEPTABLE.TTFT &&
    total <= PERFORMANCE_THRESHOLDS.ACCEPTABLE.TOTAL
  ) {
    return 'acceptable';
  }

  return 'poor';
}

/**
 * Format performance metrics for display
 * @param {number} ms - Milliseconds
 * @returns {string} Formatted string (e.g., "1.23s" or "456ms")
 */
export function formatDuration(ms) {
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(2)}s`;
  }
  return `${Math.round(ms)}ms`;
}

/**
 * Send performance metrics to analytics (if configured)
 * @param {Object} metrics - Performance metrics
 */
export function sendMetricsToAnalytics(metrics) {
  // Placeholder for Azure Application Insights or other analytics
  // In production, this would send metrics to your analytics service

  if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
    // Example: Azure Application Insights
    // window.appInsights?.trackMetric({ name: 'QueryResponseTime', value: metrics.totalTime });

    // Example: Google Analytics 4
    // gtag('event', 'performance_metric', {
    //   metric_type: 'query_response_time',
    //   value: metrics.totalTime,
    //   grade: evaluatePerformance(metrics)
    // });

    console.log('📈 Metrics ready for analytics:', metrics);
  }
}

/**
 * Performance budget warnings
 * Logs warnings when performance exceeds acceptable thresholds
 */
export function checkPerformanceBudget(metrics) {
  const grade = evaluatePerformance(metrics);

  if (grade === 'poor') {
    console.warn('⚠️ Performance budget exceeded!', {
      metrics: metrics.measures,
      threshold: PERFORMANCE_THRESHOLDS.ACCEPTABLE,
    });
    return false;
  }

  return true;
}

/**
 * Create a performance observer for tracking metrics
 * @param {Function} callback - Callback to receive performance entries
 */
export function createPerformanceObserver(callback) {
  if (typeof window === 'undefined' || !window.PerformanceObserver) {
    return null;
  }

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(callback);
    });

    observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] });

    return observer;
  } catch (error) {
    console.error('Failed to create performance observer:', error);
    return null;
  }
}
