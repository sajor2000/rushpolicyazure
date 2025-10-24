#!/usr/bin/env python3
"""
Senior-level refactoring script for page.js
Safely replaces message rendering with MessageItem component
"""

import re
import sys

def refactor_page_js(input_file, output_file):
    """Refactor page.js with MessageItem integration"""

    with open(input_file, 'r') as f:
        content = f.read()

    # Pattern 1: Replace imports
    old_imports = """'use client';
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { Send, FileText, AlertCircle, Shield, Loader2, User, MessageSquare, Users, Copy, CheckCheck, Sparkles, Clock, AlertTriangle, Building2, BookOpen } from 'lucide-react';
import { PERFORMANCE, ERROR_MESSAGES, SUCCESS_MESSAGES, API_ENDPOINTS } from './constants';
import Toast from './components/chat/Toast';
import MessageItem from './components/chat/MessageItem';"""

    new_imports = """'use client';
import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { FileText, Sparkles } from 'lucide-react';
import { PERFORMANCE, ERROR_MESSAGES, SUCCESS_MESSAGES, API_ENDPOINTS } from './constants';

// Components
import Toast from './components/chat/Toast';
import MessageItem from './components/chat/MessageItem';
import ChatInput from './components/chat/ChatInput';

// Custom Hooks
import { useToast } from './hooks/useToast';
import { useClipboard } from './hooks/useClipboard';
import { useResponseParser } from './hooks/useResponseParser';"""

    content = content.replace(old_imports, new_imports)

    # Pattern 2: Replace message rendering block
    # Find the start: "messages.map((message, index) => ("
    # Find the end: "))}\n            {isLoading && ("

    message_render_start = content.find('messages.map((message, index) => (')
    if message_render_start == -1:
        print("Error: Could not find message rendering start")
        return False

    # Find the corresponding closing "))" for the map
    # We need to count parentheses
    paren_count = 2  # Starting with "=> ("
    search_pos = message_render_start + len('messages.map((message, index) => (')
    end_pos = -1

    while search_pos < len(content) and paren_count > 0:
        char = content[search_pos]
        if char == '(':
            paren_count += 1
        elif char == ')':
            paren_count -= 1
            if paren_count == 0:
                end_pos = search_pos + 1
                break
        search_pos += 1

    if end_pos == -1:
        print("Error: Could not find message rendering end")
        return False

    # Extract the section to replace
    old_message_block = content[message_render_start:end_pos]

    # New simplified version
    new_message_block = """messages.map((message, index) => (
                <div
                  key={generateKey(message, index)}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
                  style={{ animationDelay: `${index * 50}ms` }}
                  role="article"
                  aria-label={`${message.type === 'user' ? 'Your question' : 'Assistant response'} ${index + 1}`}
                >
                  <MessageItem
                    message={message}
                    index={index}
                    parseResponse={parseResponse}
                    formatDocumentContent={formatDocumentContent}
                    copyToClipboard={copyToClipboard}
                    copiedIndex={copiedIndex}
                    generateKey={generateKey}
                  />
                </div>
              ))"""

    content = content[:message_render_start] + new_message_block + content[end_pos:]

    # Write output
    with open(output_file, 'w') as f:
        f.write(content)

    print(f"✅ Successfully refactored page.js")
    print(f"   Old size: {len(open(input_file).read())} chars")
    print(f"   New size: {len(content)} chars")
    print(f"   Saved: {len(open(input_file).read()) - len(content)} chars")

    return True

if __name__ == '__main__':
    input_file = '/Users/JCR/Desktop/rushpolicychatlocal/app/page.js'
    output_file = '/Users/JCR/Desktop/rushpolicychatlocal/app/page.refactored.js'

    success = refactor_page_js(input_file, output_file)
    sys.exit(0 if success else 1)
