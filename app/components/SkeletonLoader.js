import React from 'react';
import { Lightbulb, FileText } from 'lucide-react';

/**
 * Skeleton loader component with Rush branding
 * Displays animated placeholders while streaming content loads
 *
 * @param {string} type - Type of skeleton: 'answer', 'document', or 'full'
 * @param {number} progress - Optional progress percentage (0-100)
 */
export default function SkeletonLoader({ type = 'full', progress = 0 }) {
  if (type === 'answer' || type === 'full') {
    return (
      <div className="flex flex-col space-y-4 w-full">
        {/* Quick Answer Skeleton */}
        <div className="skeleton-answer-card">
          <div className="flex items-start space-x-3">
            {/* Icon skeleton */}
            <div className="flex-shrink-0 w-10 h-10 bg-growth/20 rounded-lg flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-growth animate-pulse" />
            </div>

            <div className="flex-1 space-y-3">
              {/* Header skeleton */}
              <div className="h-4 w-24 bg-legacy/20 rounded animate-pulse" />

              {/* Text lines skeleton */}
              <div className="space-y-2">
                <div className="h-3 bg-rush-gray/20 rounded animate-pulse" style={{ width: '95%' }} />
                <div className="h-3 bg-rush-gray/20 rounded animate-pulse" style={{ width: '88%' }} />
                <div className="h-3 bg-rush-gray/20 rounded animate-pulse" style={{ width: '75%' }} />
              </div>

              {/* Progress bar if streaming */}
              {progress > 0 && progress < 100 && (
                <div className="mt-4">
                  <div className="h-1 w-full bg-rush-gray/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-growth transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-rush-gray mt-1">Loading answer... {progress}%</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Document Skeleton (only if type is 'full') */}
        {type === 'full' && (
          <div className="border border-rush-gray/20 rounded-lg overflow-hidden">
            {/* Document header skeleton */}
            <div className="px-6 py-4 bg-sage/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <FileText className="w-5 h-5 text-legacy animate-pulse" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-48 bg-legacy/20 rounded animate-pulse" />
                    <div className="h-3 w-32 bg-rush-gray/20 rounded animate-pulse" />
                  </div>
                </div>
                <div className="h-5 w-5 bg-rush-gray/20 rounded animate-pulse" />
              </div>
            </div>

            {/* Collapsed document preview */}
            <div className="px-6 py-4 bg-white">
              <div className="space-y-2">
                <div className="h-3 bg-rush-gray/10 rounded animate-pulse" style={{ width: '70%' }} />
                <div className="h-3 bg-rush-gray/10 rounded animate-pulse" style={{ width: '65%' }} />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (type === 'document') {
    return (
      <div className="border border-rush-gray/20 rounded-lg overflow-hidden">
        {/* Document header skeleton */}
        <div className="px-6 py-4 bg-sage/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1">
              <FileText className="w-5 h-5 text-legacy animate-pulse" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-48 bg-legacy/20 rounded animate-pulse" />
                <div className="h-3 w-32 bg-rush-gray/20 rounded animate-pulse" />
              </div>
            </div>
            <div className="h-5 w-5 bg-rush-gray/20 rounded animate-pulse" />
          </div>
        </div>

        {/* Document content skeleton */}
        <div className="px-6 py-4 bg-white space-y-3">
          <div className="h-3 bg-rush-gray/10 rounded animate-pulse" />
          <div className="h-3 bg-rush-gray/10 rounded animate-pulse" style={{ width: '95%' }} />
          <div className="h-3 bg-rush-gray/10 rounded animate-pulse" style={{ width: '88%' }} />
          <div className="h-3 bg-rush-gray/10 rounded animate-pulse" style={{ width: '92%' }} />

          {/* Progress bar if streaming */}
          {progress > 0 && progress < 100 && (
            <div className="mt-4">
              <div className="h-1 w-full bg-rush-gray/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-legacy transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-rush-gray mt-1">Loading document... {progress}%</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}

/**
 * Typing indicator with animated dots
 * Shows while waiting for first response chunk
 */
export function TypingIndicator() {
  return (
    <div className="flex items-center space-x-2 px-4 py-2">
      <div className="w-10 h-10 bg-gradient-to-br from-growth to-legacy rounded-xl flex items-center justify-center flex-shrink-0">
        <FileText className="w-5 h-5 text-white" />
      </div>
      <div className="flex items-center space-x-1 px-4 py-2 bg-sage/20 rounded-lg">
        <div className="w-2 h-2 bg-legacy rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-legacy rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-legacy rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}
