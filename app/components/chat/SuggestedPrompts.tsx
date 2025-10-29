'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';
import { cn } from '@/app/lib/utils';

export interface SuggestedPrompt {
  icon: LucideIcon;
  text: string;
  category: string;
}

interface SuggestedPromptsProps {
  prompts: SuggestedPrompt[];
  onPromptClick: (promptText: string) => void;
  className?: string;
}

export default function SuggestedPrompts({
  prompts,
  onPromptClick,
  className,
}: SuggestedPromptsProps) {
  // Keyboard navigation handler
  const handleKeyDown = (e: React.KeyboardEvent, promptText: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onPromptClick(promptText);
    }
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Mobile: Horizontal Scroll Carousel */}
      <div className="md:hidden">
        <div className="flex space-x-3 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide px-1">
          {prompts.map((prompt, index) => (
            <Card
              key={`prompt-mobile-${index}-${prompt.text.substring(0, 20)}`}
              className="flex-shrink-0 w-[280px] snap-center cursor-pointer hover:shadow-xl hover:border-growth/50 hover:scale-105 transition-all duration-300 active:scale-95 focus:outline-none focus:ring-2 focus:ring-growth focus:ring-offset-2 bg-gradient-to-br from-white to-sage/10 border-growth/20"
              onClick={() => onPromptClick(prompt.text)}
              onKeyDown={(e) => handleKeyDown(e, prompt.text)}
              tabIndex={0}
              role="button"
              aria-label={`${prompt.text} - ${prompt.category}`}
            >
              <CardContent className="p-5">
                <div className="flex items-start space-x-3">
                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-growth to-vitality rounded-lg blur opacity-30"></div>
                    <div className="relative w-11 h-11 bg-gradient-to-br from-growth to-vitality rounded-lg flex items-center justify-center shadow-md">
                      <prompt.icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-legacy line-clamp-2 mb-1">
                      {prompt.text}
                    </p>
                    <p className="text-xs text-growth font-medium">{prompt.category}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {/* Scroll Indicator */}
        <p className="text-xs text-center text-rush-gray/60 mt-2 flex items-center justify-center space-x-1">
          <span>Swipe for more</span>
          <span className="animate-pulse">→</span>
        </p>
      </div>

      {/* Desktop/Tablet: 2-Column Grid */}
      <div className="hidden md:grid md:grid-cols-2 gap-4">
        {prompts.map((prompt, index) => (
          <Card
            key={`prompt-desktop-${index}-${prompt.text.substring(0, 20)}`}
            className="cursor-pointer hover:shadow-xl hover:border-growth/50 hover:scale-102 hover:-translate-y-1 transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-growth focus:ring-offset-2 bg-gradient-to-br from-white to-sage/10 border-growth/20"
            onClick={() => onPromptClick(prompt.text)}
            onKeyDown={(e) => handleKeyDown(e, prompt.text)}
            tabIndex={0}
            role="button"
            aria-label={`${prompt.text} - ${prompt.category}`}
          >
            <CardContent className="p-5">
              <div className="flex items-start space-x-4">
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-r from-growth to-vitality rounded-xl blur-md opacity-0 group-hover:opacity-40 transition-opacity duration-300"></div>
                  <div className="relative w-12 h-12 bg-gradient-to-br from-growth to-vitality rounded-xl flex items-center justify-center shadow-md group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                    <prompt.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="flex-1 pt-0.5">
                  <p className="text-sm font-semibold text-legacy group-hover:text-growth transition-colors mb-1.5">
                    {prompt.text}
                  </p>
                  <p className="text-xs text-growth font-medium group-hover:text-legacy transition-colors">
                    {prompt.category}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
