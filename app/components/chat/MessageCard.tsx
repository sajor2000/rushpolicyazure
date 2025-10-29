'use client';

import React from 'react';
import {
  User,
  FileText,
  AlertTriangle,
  AlertCircle,
  MessageSquare,
  BookOpen,
  Copy,
  CheckCheck,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';

interface MessageCardProps {
  message: {
    type: 'user' | 'bot' | 'error';
    content: string;
    timestamp?: Date;
  };
  index: number;
  parseResponse: (content: string) => {
    answer: string;
    fullDocument: string;
    metadata: any;
  };
  onCopy: (text: string, key: string) => void;
  copiedKey: string | null;
  onViewDocument?: (document: string, metadata: any) => void;
}

export default function MessageCard({
  message,
  index,
  parseResponse,
  onCopy,
  copiedKey,
  onViewDocument,
}: MessageCardProps) {
  // User message
  if (message.type === 'user') {
    return (
      <div className="flex items-start space-x-3 justify-end max-w-2xl ml-auto">
        <Card className="bg-gradient-to-br from-navy to-purple border-navy/20 shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-4 md:p-5">
            <p className="text-white font-medium text-sm md:text-base">{message.content}</p>
            {message.timestamp && (
              <p className="text-white/90 text-xs mt-2">
                {message.timestamp.toLocaleTimeString()}
              </p>
            )}
          </CardContent>
        </Card>
        <div className="w-10 h-10 bg-gradient-to-br from-navy to-purple rounded-xl flex items-center justify-center flex-shrink-0 shadow-md border border-violet/30">
          <User className="w-5 h-5 text-white" />
        </div>
      </div>
    );
  }

  // Error message
  if (message.type === 'error') {
    return (
      <div className="flex items-start space-x-3 w-full max-w-3xl">
        <div className="w-10 h-10 bg-gradient-to-br from-blush to-red-400 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
          <AlertTriangle className="w-5 h-5 text-white" />
        </div>
        <Card className="flex-1 bg-blush/40 border-red-400 border-2 shadow-md">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center space-x-2 mb-2">
              <AlertCircle className="w-5 h-5 text-red-700" />
              <h3 className="font-semibold text-red-900">Error</h3>
            </div>
            <p className="text-red-900 leading-relaxed text-sm md:text-base">
              {message.content}
            </p>
            {message.timestamp && (
              <p className="text-red-700 text-xs mt-2">
                {message.timestamp.toLocaleTimeString()}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Bot response (answer + document)
  const { answer, fullDocument, metadata } = parseResponse(message.content);

  return (
    <div className="flex items-start space-x-3 w-full max-w-4xl">
      <div className="w-10 h-10 bg-gradient-to-br from-growth to-legacy rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
        <FileText className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 space-y-4">
        {/* Answer Card */}
        {answer && (
          <Card className="bg-gradient-to-br from-sage/30 to-vitality/10 border-growth/40 border-2 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5 text-growth" />
                  <h3 className="text-lg md:text-xl font-bold text-legacy">Answer</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCopy(answer, `answer-${index}`)}
                  disabled={copiedKey === `answer-${index}`}
                  aria-label={
                    copiedKey === `answer-${index}`
                      ? 'Answer copied to clipboard'
                      : 'Copy answer to clipboard'
                  }
                >
                  {copiedKey === `answer-${index}` ? (
                    <>
                      <CheckCheck className="w-4 h-4 mr-2" />
                      <span className="text-sm">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      <span className="text-sm">Copy</span>
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-rush-black text-sm md:text-base leading-relaxed">
                {answer}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Source Document Card */}
        {fullDocument && fullDocument.length > 0 && (
          <Card className="border-legacy/30 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-5 h-5 text-legacy" />
                  <h3 className="text-base md:text-lg font-bold text-legacy">
                    Source Document Evidence
                  </h3>
                </div>
                <Button
                  variant="rush-secondary"
                  size="sm"
                  onClick={() => onViewDocument?.(fullDocument, metadata)}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  <span className="text-sm">View Full Document</span>
                </Button>
              </div>

              {/* Metadata Badges */}
              {(metadata.policyNumber ||
                metadata.effectiveDate ||
                metadata.department) && (
                <div className="flex flex-wrap gap-2 pt-3 border-t border-rush-gray/10">
                  {metadata.policyNumber && (
                    <Badge variant="rush-policy">
                      Policy #{metadata.policyNumber}
                    </Badge>
                  )}
                  {metadata.effectiveDate && (
                    <Badge variant="outline">{metadata.effectiveDate}</Badge>
                  )}
                  {metadata.department && (
                    <Badge variant="rush-category">{metadata.department}</Badge>
                  )}
                </div>
              )}
            </CardHeader>
            <CardContent className="pt-0">
              <div className="prose prose-sm max-w-none text-rush-black/70">
                <p className="line-clamp-3 text-sm">
                  {fullDocument.substring(0, 200)}...
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
