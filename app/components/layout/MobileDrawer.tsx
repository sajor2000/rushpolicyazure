'use client';

import React from 'react';
import Image from 'next/image';
import { FileText, Sparkles, Trash2, Info } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/app/components/ui/sheet';
import { Button } from '@/app/components/ui/button';
import { Separator } from '@/app/components/ui/separator';

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  onClearConversation?: () => void;
  messageCount?: number;
}

export default function MobileDrawer({
  open,
  onClose,
  onClearConversation,
  messageCount = 0,
}: MobileDrawerProps) {
  const handleClear = () => {
    onClearConversation?.();
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="left" className="w-[300px] sm:w-[400px]">
        <SheetHeader>
          <div className="flex items-center space-x-3 mb-4">
            <div className="relative w-[100px] h-8">
              <Image
                src="/images/rush-logo.jpg"
                alt="Rush University"
                fill
                sizes="100px"
                className="object-contain"
              />
            </div>
          </div>
          <SheetTitle className="text-left">Policy Chat</SheetTitle>
          <SheetDescription className="text-left">
            AI-powered assistant for Rush PolicyTech documents
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* App Info Card */}
          <div className="p-4 bg-sage/20 rounded-lg border border-growth/30">
            <div className="flex items-center space-x-2 mb-2">
              <Sparkles className="w-5 h-5 text-growth" />
              <h3 className="font-semibold text-legacy">GPT-5 Chat Model</h3>
            </div>
            <p className="text-sm text-rush-black/70">
              Powered by Azure AI with access to 1300+ official PolicyTech documents
            </p>
          </div>

          <Separator />

          {/* Stats */}
          <div className="p-4 bg-white rounded-lg border border-rush-gray/20">
            <div className="flex items-center space-x-2 mb-2">
              <FileText className="w-5 h-5 text-legacy" />
              <h3 className="font-semibold text-legacy">Session Info</h3>
            </div>
            <div className="space-y-1 text-sm text-rush-black/70">
              <p>Messages: {messageCount}</p>
              <p>Status: Active</p>
            </div>
          </div>

          {/* Clear Conversation Button */}
          {messageCount > 0 && (
            <>
              <Separator />
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleClear}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Conversation
              </Button>
            </>
          )}

          {/* Footer Info */}
          <div className="pt-6 mt-6 border-t border-rush-gray/20">
            <div className="flex items-start space-x-2 text-xs text-rush-black/60">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="mb-1">
                  <strong>Internal Use Only</strong>
                </p>
                <p>
                  For authorized Rush University System for Health staff only.
                  All queries are processed securely.
                </p>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
