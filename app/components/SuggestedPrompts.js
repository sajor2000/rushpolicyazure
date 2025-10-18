/**
 * Suggested Prompts Component
 *
 * Displays clickable suggested prompts to help users get started
 * with common policy questions.
 */

'use client';
import React from 'react';
import { Shield, FileText, Users, Clock } from 'lucide-react';

const SUGGESTED_PROMPTS = [
  { icon: Shield, text: "What are our HIPAA privacy requirements?", category: "Compliance & Privacy" },
  { icon: FileText, text: "Show me the infection control policy", category: "Clinical Guidance" },
  { icon: Users, text: "Can I work remotely?", category: "Workforce & HR" },
  { icon: Clock, text: "How does PTO accrual work?", category: "Time & Benefits" },
];

/**
 * Suggested Prompts Component
 * @param {Object} props - Component props
 * @param {Function} props.onPromptClick - Callback when a prompt is clicked
 * @returns {React.Element} Suggested prompts grid
 */
export default function SuggestedPrompts({ onPromptClick }) {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="text-center max-w-2xl">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-sage/30 rounded-full mb-6">
          <FileText className="w-8 h-8 text-growth" />
        </div>
        <p className="text-base text-rush-black/60 mb-8">
          Ask about HIPAA, PTO, infection control, remote work, or any Rush policy
        </p>

        {/* Suggested Prompts Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SUGGESTED_PROMPTS.map((prompt, index) => (
            <button
              key={index}
              onClick={() => onPromptClick(prompt.text)}
              className="p-4 bg-white border border-rush-gray/30 rounded-lg hover:border-growth hover:bg-sage/10 transition-all text-left group"
              aria-label={`Ask about: ${prompt.text}`}
            >
              <div className="flex items-center space-x-3">
                <prompt.icon className="w-5 h-5 text-growth flex-shrink-0 group-hover:scale-110 transition-transform" />
                <span className="text-sm text-rush-black">{prompt.text}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
