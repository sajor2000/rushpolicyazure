'use client';

import React from 'react';
import Image from 'next/image';
import { Menu } from 'lucide-react';
import { Button } from '@/app/components/ui/button';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="bg-white border-b border-rush-gray/20 sticky top-0 z-40 shadow-sm backdrop-blur-sm">
      <div className="container mx-auto px-4 md:px-6 py-4 md:py-6">
        <div className="flex items-center justify-between">
          {/* Mobile: Hamburger + Logo */}
          <div className="flex items-center space-x-3">
            {/* Hamburger Menu - Mobile Only */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden touch-action-manipulation"
              onClick={onMenuClick}
              aria-label="Open navigation menu"
            >
              <Menu className="h-6 w-6 text-legacy" />
            </Button>

            {/* Logo + Branding */}
            <div className="flex items-center space-x-3 md:space-x-5">
              <div className="relative w-[110px] h-8 md:w-[150px] md:h-12">
                <Image
                  src="/images/rush-logo.jpg"
                  alt="Rush University System for Health"
                  fill
                  sizes="(max-width: 768px) 110px, 150px"
                  priority
                  className="object-contain"
                />
              </div>
              <div className="hidden sm:block h-8 md:h-12 w-px bg-gradient-to-b from-transparent via-rush-gray/40 to-transparent" />
              <div className="flex flex-col">
                <h1 className="text-xl md:text-3xl font-bold text-legacy tracking-tight">
                  Policy Chat
                </h1>
                <p className="hidden md:block text-sm text-rush-gray mt-0.5">
                  Official PolicyTech Assistant
                </p>
              </div>
            </div>
          </div>

          {/* Desktop: Helper Text */}
          <div className="hidden md:flex items-center text-sm text-rush-gray">
            <span>1,300+ Policies</span>
          </div>
        </div>
      </div>
    </header>
  );
}
