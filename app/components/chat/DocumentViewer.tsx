'use client';

import React, { useState } from 'react';
import { Copy, CheckCheck, FileText, Clock, Building2, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/app/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/app/components/ui/sheet';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { Separator } from '@/app/components/ui/separator';
import Image from 'next/image';

interface DocumentViewerProps {
  open: boolean;
  onClose: () => void;
  document: string;
  metadata?: {
    policyNumber?: string;
    policyTitle?: string;
    effectiveDate?: string;
    department?: string;
  };
  onCopy: (text: string, key: string) => void;
  copiedKey: string | null;
  formatDocumentContent?: (content: string) => React.ReactNode;
  timestamp?: Date;
}

export default function DocumentViewer({
  open,
  onClose,
  document,
  metadata = {},
  onCopy,
  copiedKey,
  formatDocumentContent,
  timestamp,
}: DocumentViewerProps) {
  const [isMobile, setIsMobile] = useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const documentHeader = (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-3">
        <div className="relative w-16 h-8">
          <Image
            src="/images/rush-logo.jpg"
            alt="Rush"
            fill
            sizes="64px"
            className="object-contain"
          />
        </div>
        <Separator orientation="vertical" className="h-8" />
        <div>
          <h4 className="font-semibold text-legacy text-base">
            {metadata.policyTitle || 'Rush University Policy Document'}
          </h4>
          <p className="text-xs text-rush-black/70">PolicyTech Database</p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onCopy(document, 'document-viewer')}
        disabled={copiedKey === 'document-viewer'}
        aria-label={
          copiedKey === 'document-viewer'
            ? 'Document copied to clipboard'
            : 'Copy full document to clipboard'
        }
      >
        {copiedKey === 'document-viewer' ? (
          <>
            <CheckCheck className="w-4 h-4 mr-2" />
            <span>Copied</span>
          </>
        ) : (
          <>
            <Copy className="w-4 h-4 mr-2" />
            <span>Copy</span>
          </>
        )}
      </Button>
    </div>
  );

  const metadataBadges = (
    <>
      {(metadata.policyNumber ||
        metadata.effectiveDate ||
        metadata.department) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {metadata.policyNumber && (
            <Badge variant="rush-policy" className="flex items-center space-x-1">
              <FileText className="w-3 h-3" />
              <span>Policy #{metadata.policyNumber}</span>
            </Badge>
          )}
          {metadata.effectiveDate && (
            <Badge variant="outline" className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{metadata.effectiveDate}</span>
            </Badge>
          )}
          {metadata.department && (
            <Badge variant="rush-category" className="flex items-center space-x-1">
              <Building2 className="w-3 h-3" />
              <span>{metadata.department}</span>
            </Badge>
          )}
        </div>
      )}
    </>
  );

  const documentBody = (
    <div className="pdf-body prose prose-sm max-w-none">
      {formatDocumentContent ? formatDocumentContent(document) : <p>{document}</p>}
    </div>
  );

  const documentFooter = (
    <div className="mt-6 pt-4 border-t border-rush-gray/20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-rush-black/70">
        <div>
          <div className="mb-1">
            <span className="font-semibold">Source:</span> Rush PolicyTech Database
          </div>
          <div>
            <span className="font-semibold">Access:</span> Authorized Personnel Only
          </div>
        </div>
        <div className="md:text-right">
          <div className="mb-1">
            <span className="font-semibold">Retrieved:</span>{' '}
            {timestamp?.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }) || new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
          <div>
            <span className="font-semibold">Property of:</span> Rush University System for Health
          </div>
        </div>
      </div>
    </div>
  );

  // Desktop: Use Dialog
  if (!isMobile) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <div className="flex flex-col h-full max-h-[90vh]">
            <div className="p-6 pb-4">
              {documentHeader}
              {metadataBadges}
            </div>
            <ScrollArea className="flex-1 px-6">
              {documentBody}
              {documentFooter}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Mobile: Use Sheet (full-screen slide-up)
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[95vh] p-0">
        <div className="flex flex-col h-full">
          <div className="p-4 pb-3 border-b border-rush-gray/20">
            {documentHeader}
            {metadataBadges}
          </div>
          <ScrollArea className="flex-1 px-4">
            {documentBody}
            {documentFooter}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
