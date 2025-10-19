'use client';
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { Send, FileText, AlertCircle, Shield, Loader2, User, MessageSquare, Users, Copy, CheckCheck, Sparkles, Clock, AlertTriangle, Building2, BookOpen } from 'lucide-react';
import { PERFORMANCE, ERROR_MESSAGES, SUCCESS_MESSAGES, API_ENDPOINTS } from './constants';

// Content-based key generation for stable React keys
function generateKey(content, index) {
  // Simple hash function for content-based keys
  const hash = String(content).split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);
  return `${Math.abs(hash)}-${index}`;
}

/**
 * Rush Policy Assistant - Azure GPT-5 Chat Model
 *
 * This application uses Azure GPT-5 Chat Model (latest generation) via Azure AI Agent
 * with Managed Identity authentication (zero API keys required).
 *
 * Rush University System for Health - Official Brand Color Palette
 *
 * Primary Colors:
 * - Legacy: #006332 (Primary green - represents heritage and trust)
 * - Growth: #30AE6E (Vibrant green - represents progress)
 * - Vitality: #5FEEA2 (Bright green - represents energy)
 * - Sage: #DFF9EB (Soft green - represents calm and care)
 *
 * Accent Colors:
 * - Gold: #FFC60B (Optimism and excellence)
 * - Sky Blue: #54ADD3 (Innovation and clarity)
 * - Navy: #005D83 (Trust and professionalism)
 * - Purple: #2D1D4E (Wisdom and dignity)
 * - Violet: #6C43B9 (Creativity and vision)
 * - Blush: #FFE3E0 (Warmth and compassion)
 * - Sand: #F2DBB3 (Comfort and accessibility)
 *
 * Neutrals:
 * - Rush Black: #5F5858 (Primary text)
 * - Rush Gray: #AFAEAF (Secondary text)
 *
 * Brand Voice: Inclusive, Invested, Inventive, Accessible
 */

const SUGGESTED_PROMPTS = [
  { icon: Shield, text: "What are our HIPAA privacy requirements?", category: "Compliance & Privacy" },
  { icon: FileText, text: "Show me the infection control policy", category: "Clinical Guidance" },
  { icon: Users, text: "Can I work remotely?", category: "Workforce & HR" },
  { icon: Clock, text: "How does PTO accrual work?", category: "Time & Benefits" },
];

// Memoized suggested prompts component to prevent unnecessary re-renders
const SuggestedPromptsGrid = React.memo(({ onPromptClick }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
    {SUGGESTED_PROMPTS.map((prompt, index) => (
      <button
        key={generateKey(prompt.text, index)}
        onClick={() => onPromptClick(prompt.text)}
        className="p-4 bg-white border border-rush-gray/30 rounded-lg hover:border-growth hover:bg-sage/10 transition-all text-left"
      >
        <div className="flex items-center space-x-3">
          <prompt.icon className="w-5 h-5 text-growth flex-shrink-0" />
          <span className="text-sm text-rush-black">{prompt.text}</span>
        </div>
      </button>
    ))}
  </div>
));

SuggestedPromptsGrid.displayName = 'SuggestedPromptsGrid';

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [toast, setToast] = useState(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const abortControllerRef = useRef(null);
  const toastTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    // Only auto-scroll if user is near bottom (within SCROLL_THRESHOLD pixels)
    const container = messagesContainerRef.current;
    if (container) {
      const isNearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight < PERFORMANCE.SCROLL_THRESHOLD;

      if (isNearBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      // Fallback if container ref not available
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e) => {
      // Cmd/Ctrl + K to focus input
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      // Escape to clear input
      if (e.key === 'Escape' && inputRef.current === document.activeElement) {
        setInputValue('');
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cancel any pending fetch requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      // Clear toast timeout
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const showToast = useCallback((message, type = 'success') => {
    // Clear existing timeout to prevent race conditions
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }

    setToast({ message, type });

    // Set new timeout with ref tracking
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
      toastTimeoutRef.current = null;
    }, 3000);
  }, []);

  // Parse response and extract answer, document, and metadata (Memoized for performance)
  const parseResponse = useCallback((content) => {
    // Split content into answer and full document sections
    let answer = '';
    let fullDocument = '';

    // Look for the ANSWER: and FULL_POLICY_DOCUMENT: markers
    // Stop answer extraction at PART 2 separator or FULL_POLICY_DOCUMENT marker
    const answerMatch = content.match(/ANSWER:\s*([\s\S]*?)(?=━+\s*PART 2|FULL_POLICY_DOCUMENT:|$)/i);
    const documentMatch = content.match(/FULL_POLICY_DOCUMENT:\s*([\s\S]*?)(?=━+\s*SOURCE CITATIONS|$)/i);

    if (answerMatch && answerMatch[1]) {
      // Clean up the answer (remove separator lines and extra whitespace)
      answer = answerMatch[1]
        .replace(/━+/g, '') // Remove separator lines
        .replace(/PART \d+ - .*?\n/gi, '') // Remove PART headers
        .trim();
    }

    if (documentMatch && documentMatch[1]) {
      fullDocument = documentMatch[1].trim();
    } else {
      // Fallback: if no FULL_POLICY_DOCUMENT marker, use entire content as document
      fullDocument = content;
    }

    // Extract key metadata from the full document section
    const policyNumberMatch = fullDocument.match(/(?:Policy\s*(?:Number|#)?|Reference\s*Number)\s*:?\s*([A-Z0-9\-]+)/i);
    const titleMatch = fullDocument.match(/(?:Policy\s*Title)\s*:?\s*([^\n]+)/i);
    const effectiveDateMatch = fullDocument.match(/(?:Effective\s*Date|Date\s*Approved)\s*:?\s*([^\n]+)/i);
    const departmentMatch = fullDocument.match(/(?:Department|Applies\s*To|Document\s*Owner)\s*:?\s*([^\n]+)/i);

    return {
      answer: answer,
      fullDocument: fullDocument,
      content: content, // Keep full content for backward compatibility
      metadata: {
        policyNumber: policyNumberMatch ? policyNumberMatch[1].trim() : null,
        policyTitle: titleMatch ? titleMatch[1].trim() : null,
        effectiveDate: effectiveDateMatch ? effectiveDateMatch[1].trim() : null,
        department: departmentMatch ? departmentMatch[1].trim() : null,
      }
    };
  }, []);

  // Parse policy metadata header into structured object (Memoized with safety limit)
  // Enhanced to handle Rush policy table-based layouts with multi-column format
  const parseMetadataHeader = useCallback((lines) => {
    // Safety limit to prevent performance issues with large documents
    const safeLines = lines.slice(0, PERFORMANCE.MAX_METADATA_LINES);

    const metadata = {
      institution: 'Rush University System for Health',
      policyTitle: '',
      policyNumber: '',
      referenceNumber: '',
      documentOwner: '',
      approver: '',
      dateCreated: '',
      dateApproved: '',
      dateUpdated: '',
      reviewDue: '',
      appliesTo: '',
      notice: 'Printed copies are for reference only. Please refer to the electronic copy for the latest version'
    };

    // Join lines into single text block for better multi-column table parsing
    const headerText = safeLines.join('\n');

    // Enhanced extraction patterns for table-based layout
    // Patterns match: "Label: Value" where Value ends at pipe "|", newline, or another Label
    const extractors = {
      // Policy Title - capture until Policy Number or pipe or newline
      policyTitle: /Policy Title:\s*([^\n|]+?)(?:\s*\||Policy Number:|\n|$)/i,

      // Policy Number - capture until next field or line end
      policyNumber: /Policy Number:\s*([^\n|]+?)(?:\s*\||\n|Document Owner:|$)/i,

      // Reference Number (alternative to Policy Number in some documents)
      referenceNumber: /Reference Number:\s*([^\n|]+?)(?:\s*\||\n|$)/i,

      // Document Owner - capture until Approver or pipe or newline
      documentOwner: /Document Owner:\s*([^\n|]+?)(?:\s*\||Approver|\n|$)/i,

      // Approver - capture until next field or line end
      approver: /Approver\(s\)?:\s*([^\n|]+?)(?:\s*\||\n|Date Created:|$)/i,

      // Date fields - capture until next field or pipe or newline
      dateCreated: /Date Created:\s*([^\n|]+?)(?:\s*\||Date Approved:|\n|$)/i,
      dateApproved: /Date Approved:\s*([^\n|]+?)(?:\s*\||Date Updated:|\n|$)/i,
      dateUpdated: /Date Updated:\s*([^\n|]+?)(?:\s*\||Review Due:|\n|$)/i,
      reviewDue: /Review Due:\s*([^\n|]+?)(?:\s*\||\n|Applies To:|$)/i,

      // Applies To - often contains checkboxes, capture entire line
      appliesTo: /Applies To:\s*([^\n]+?)(?:\n|Printed copies|$)/i,

      // Notice - the standard disclaimer
      notice: /(Printed copies are for reference only[^\n]*)/i
    };

    // Apply extractors to header text
    for (const [key, pattern] of Object.entries(extractors)) {
      const match = headerText.match(pattern);
      if (match && match[1]) {
        let value = match[1].trim();

        // Clean up the extracted value
        value = value
          .replace(/☒/g, '✓')          // Normalize checkboxes to checkmarks
          .replace(/☐/g, '○')          // Empty checkboxes to circles
          .replace(/\*\*/g, '')        // Remove markdown bold
          .replace(/\s+/g, ' ')        // Normalize whitespace
          .replace(/\|\s*$/,'')        // Remove trailing pipes
          .trim();

        metadata[key] = value;
      }
    }

    // Post-processing: Handle special cases
    // If policyNumber is empty but referenceNumber exists, use it
    if (!metadata.policyNumber && metadata.referenceNumber) {
      metadata.policyNumber = metadata.referenceNumber;
    }

    // Ensure all values are strings, use 'Not specified' for empty required fields
    Object.keys(metadata).forEach(key => {
      if (!metadata[key] || metadata[key] === 'Not Set' || metadata[key] === '') {
        // Keep institution and notice defaults, mark others as not specified
        if (key !== 'institution' && key !== 'notice') {
          metadata[key] = 'Not specified';
        }
      }
    });

    return metadata;
  }, []);

  // PDF-style document formatting with professional typography (Memoized for performance)
  const formatDocumentContent = useCallback((content) => {
    const lines = content.split('\n');
    const formatted = [];
    let currentSection = null;
    let inMetadataHeader = false;
    let metadataLines = [];
    let lastLineWasEmpty = false;

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      // Skip consecutive blank lines to reduce excessive whitespace
      if (!trimmedLine) {
        if (lastLineWasEmpty) {
          return; // Skip consecutive blank line
        }
        lastLineWasEmpty = true;
      } else {
        lastLineWasEmpty = false;
      }

      // Detect start of metadata header
      if (trimmedLine.includes('RUSH UNIVERSITY') && index < 5) {
        inMetadataHeader = true;
        metadataLines = [];
      }

      // Collect metadata lines
      if (inMetadataHeader) {
        metadataLines.push(line);

        // End of metadata header (separator line or section start)
        if (trimmedLine.match(/^━+$/) || trimmedLine.match(/^[IVX]+\.\s/) ||
            (trimmedLine.match(/^NOTE:/i) && metadataLines.length > 5)) {
          inMetadataHeader = false;

          // Parse and render metadata box - PDF Table Format
          const metadata = parseMetadataHeader(metadataLines);
          formatted.push(
            <div key="metadata-box" className="policy-metadata-box">
              {/* Rush Logo Header */}
              <div className="metadata-header-row">
                <img src="/images/rush-logo.jpg" alt="Rush University System for Health" className="metadata-logo" />
              </div>

              {/* Metadata Table */}
              <table className="metadata-table">
                <tbody>
                  {/* Row 1: Policy Title and Policy Number */}
                  <tr>
                    <td className="metadata-cell metadata-cell-wide">
                      <div className="metadata-label">Policy Title:</div>
                      <div className="metadata-value">{metadata.policyTitle || '\u00A0'}</div>
                    </td>
                    <td className="metadata-cell">
                      <div className="metadata-label">Policy Number:</div>
                      <div className="metadata-value">{metadata.policyNumber || '\u00A0'}</div>
                    </td>
                  </tr>

                  {/* Row 2: Document Owner and Approver */}
                  <tr>
                    <td className="metadata-cell">
                      <div className="metadata-label">Document Owner:</div>
                      <div className="metadata-value">{metadata.documentOwner || '\u00A0'}</div>
                    </td>
                    <td className="metadata-cell">
                      <div className="metadata-label">Approver(s):</div>
                      <div className="metadata-value">{metadata.approver || '\u00A0'}</div>
                    </td>
                  </tr>

                  {/* Row 3: Dates */}
                  <tr>
                    <td className="metadata-cell-date">
                      <div className="metadata-label">Date Created:</div>
                      <div className="metadata-value">{metadata.dateCreated || 'Not Set'}</div>
                    </td>
                    <td className="metadata-cell-date">
                      <div className="metadata-label">Date Approved:</div>
                      <div className="metadata-value">{metadata.dateApproved || '\u00A0'}</div>
                    </td>
                    <td className="metadata-cell-date">
                      <div className="metadata-label">Date Updated:</div>
                      <div className="metadata-value">{metadata.dateUpdated || '\u00A0'}</div>
                    </td>
                    <td className="metadata-cell-date metadata-cell-last">
                      <div className="metadata-label">Review Due:</div>
                      <div className="metadata-value">{metadata.reviewDue || '\u00A0'}</div>
                    </td>
                  </tr>

                  {/* Row 4: Applies To */}
                  <tr>
                    <td colSpan="4" className="metadata-applies-to">
                      <span className="font-semibold">Applies To:</span> {metadata.appliesTo || 'Not specified'}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Warning Notice */}
              <div className="metadata-notice">{metadata.notice}</div>
            </div>
          );

          metadataLines = [];
          return;
        }
        return; // Skip individual metadata line rendering
      }

      // Skip empty lines but preserve minimal spacing (reduced from h-4 to h-2)
      if (!trimmedLine) {
        formatted.push(<div key={generateKey('empty-line', index)} className="h-2"></div>);
        return;
      }

      // Major section headers (### style or Section:)
      if (trimmedLine.startsWith('###') || trimmedLine.match(/^(POLICY|SECTION|PROCEDURE|DEFINITIONS?|REFERENCES?|SCOPE|PURPOSE)/i)) {
        const headerText = trimmedLine.replace(/^###\s*/, '').replace(/^📋\s*/, '');
        formatted.push(
          <h2 key={generateKey(headerText, index)} className="pdf-section-header">
            {headerText}
          </h2>
        );
      }
      // Subsection headers (** style or bold indicators)
      else if (trimmedLine.startsWith('**') || trimmedLine.match(/^[IVX]+\.\s/) || trimmedLine.match(/^\d+\.\s[A-Z]/)) {
        const headerText = trimmedLine.replace(/^\*\*/, '').replace(/\*\*$/, '');
        formatted.push(
          <h3 key={generateKey(headerText, index)} className="pdf-subsection-header">
            {headerText}
          </h3>
        );
      }
      // Metadata lines (key: value format)
      else if (trimmedLine.includes(':') && trimmedLine.length < 100 && !trimmedLine.match(/^[a-z]/)) {
        const [key, ...valueParts] = trimmedLine.split(':');
        const value = valueParts.join(':').trim();
        formatted.push(
          <div key={generateKey(trimmedLine, index)} className="pdf-metadata-line">
            <span className="pdf-metadata-key">{key}:</span>
            <span className="pdf-metadata-value">{value}</span>
          </div>
        );
      }
      // Bulleted list items
      else if (trimmedLine.match(/^[•\-\*]\s/) || trimmedLine.match(/^[☒☐]\s/)) {
        const text = trimmedLine.replace(/^[•\-\*☒☐]\s*/, '');
        const isChecked = trimmedLine.startsWith('☒');
        formatted.push(
          <div key={generateKey(text, index)} className="pdf-list-item">
            <span className="pdf-bullet">{isChecked ? '☑' : '•'}</span>
            <span>{text}</span>
          </div>
        );
      }
      // Numbered list items (a., i., 1., etc.)
      else if (trimmedLine.match(/^[a-z]\.\s/) || trimmedLine.match(/^[ivx]+\.\s/) || trimmedLine.match(/^\d+\.\s/)) {
        formatted.push(
          <div key={generateKey(trimmedLine, index)} className="pdf-numbered-item">
            {trimmedLine}
          </div>
        );
      }
      // Quoted or highlighted text (>)
      else if (trimmedLine.startsWith('>')) {
        const text = trimmedLine.replace(/^>\s*/, '');
        formatted.push(
          <blockquote key={generateKey(text, index)} className="pdf-blockquote">
            {text}
          </blockquote>
        );
      }
      // Separator lines (---, ===)
      else if (trimmedLine.match(/^[-=]{3,}$/)) {
        formatted.push(
          <hr key={generateKey('separator', index)} className="pdf-separator" />
        );
      }
      // Warning/Note indicators
      else if (trimmedLine.match(/^⚠️|^💡|^ℹ️|^NOTE:|^WARNING:/i)) {
        formatted.push(
          <div key={generateKey(trimmedLine, index)} className="pdf-notice">
            {trimmedLine}
          </div>
        );
      }
      // Regular paragraph text
      else {
        formatted.push(
          <p key={generateKey(trimmedLine, index)} className="pdf-paragraph">
            {trimmedLine}
          </p>
        );
      }
    });

    return formatted;
  }, [parseMetadataHeader]);

  const copyToClipboard = useCallback(async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      showToast(SUCCESS_MESSAGES.COPIED);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      showToast(ERROR_MESSAGES.COPY_FAILED, 'error');
    }
  }, [showToast]);

  const sendMessage = async (e, promptText = null) => {
    if (e) e.preventDefault();
    const messageToSend = promptText || inputValue;
    const trimmedMessage = messageToSend.trim();

    // Input validation
    if (!trimmedMessage || isLoading) return;

    // Character limit validation
    if (trimmedMessage.length > PERFORMANCE.MAX_MESSAGE_LENGTH) {
      showToast(ERROR_MESSAGES.MESSAGE_TOO_LONG(PERFORMANCE.MAX_MESSAGE_LENGTH), 'error');
      return;
    }

    // Sanitize control characters that might break parsing
    const sanitizedMessage = trimmedMessage
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
      .slice(0, PERFORMANCE.MAX_MESSAGE_LENGTH);

    setInputValue('');

    // Add user message with animation
    setMessages(prev => [...prev, { type: 'user', content: sanitizedMessage, timestamp: new Date() }]);
    setIsLoading(true);

    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(API_ENDPOINTS.AZURE_AGENT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: sanitizedMessage
          // Note: Backend always creates fresh thread (stateless architecture)
          // No resetConversation flag needed - every request is fresh
        }),
        signal: abortControllerRef.current.signal
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('JSON parse error:', jsonError);
        throw new Error(ERROR_MESSAGES.INVALID_RESPONSE);
      }

      if (!response.ok) {
        throw new Error(data.details || data.error || `HTTP error! status: ${response.status}`);
      }

      // Add bot response
      setMessages(prev => [...prev, { type: 'bot', content: data.response, timestamp: new Date() }]);
      showToast(SUCCESS_MESSAGES.RESPONSE_RECEIVED);
    } catch (error) {
      // Handle aborted requests silently
      if (error.name === 'AbortError') {
        console.log('Request was cancelled by user sending new message');
        return;
      }

      console.error("Error sending message:", error);
      const messageText = typeof error === 'string' ? error : error?.message;
      let errorMessage = messageText || ERROR_MESSAGES.CONNECTION_FAILED;

      setMessages(prev => [...prev, {
        type: 'error',
        content: errorMessage,
        timestamp: new Date()
      }]);
      showToast('Error occurred', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Memoized callback for suggested prompts to prevent unnecessary re-renders
  const handlePromptClick = useCallback((promptText) => {
    sendMessage(null, promptText);
  }, []);

  const handleClear = async () => {
    setInputValue('');
    setMessages([]);
    try {
      await fetch(API_ENDPOINTS.AZURE_AGENT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'reset', resetConversation: true })
      });
      showToast(SUCCESS_MESSAGES.CONVERSATION_CLEARED);
    } catch (error) {
      console.log('Conversation reset requested');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-sage/20 flex flex-col">
      {/* Toast Notification */}
      {toast && (
        <div 
          role="status" 
          aria-live="polite" 
          aria-atomic="true"
          className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 ease-out ${
            toast.type === 'success' 
              ? 'bg-growth text-white' 
              : 'bg-blush border-2 border-red-500 text-red-700'
          } animate-slide-in-right`}
        >
          <div className="flex items-center space-x-2">
            {toast.type === 'success' ? (
              <CheckCheck className="w-5 h-5" aria-hidden="true" />
            ) : (
              <AlertCircle className="w-5 h-5" aria-hidden="true" />
            )}
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Enhanced Header */}
      <header className="bg-white border-b border-rush-gray/20 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-6 md:py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 md:space-x-5">
              <div className="relative w-[130px] h-10 md:w-[150px] md:h-12">
                <Image
                  src="/images/rush-logo.jpg"
                  alt="Rush University System for Health"
                  fill
                  sizes="(max-width: 768px) 130px, 150px"
                  priority
                  className="object-contain"
                />
              </div>
              <div className="h-10 md:h-12 w-px bg-gradient-to-b from-transparent via-rush-gray/40 to-transparent"></div>
              <div className="flex flex-col">
                <h1 className="text-2xl md:text-3xl font-bold text-legacy tracking-tight">Policy Chat</h1>
                <p className="hidden md:block text-sm text-rush-gray mt-0.5">Official PolicyTech Assistant</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-sage/30 rounded-full border border-growth/20">
              <div className="w-2 h-2 bg-growth rounded-full animate-pulse"></div>
              <span className="text-xs md:text-sm font-medium text-legacy">Ready</span>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Container */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
        <div className="bg-white rounded-xl shadow-lg border border-rush-gray/20 h-full max-h-[750px] flex flex-col">
          {/* Chat Header */}
          <div className="border-b border-rush-gray/20 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-legacy">Ask your policy question</h2>
                <p className="text-sm text-rush-black/70 mt-1">Get answers from 1300+ PolicyTech documents</p>
              </div>
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-vitality/10 rounded-lg border border-vitality/30">
                <Sparkles className="w-4 h-4 text-growth" />
                <span className="text-xs font-medium text-legacy">GPT-5 Chat</span>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-6 space-y-6"
            role="log"
            aria-label="Chat conversation history"
            aria-live="polite"
            aria-atomic="false"
          >
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="text-center max-w-2xl">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-sage/30 rounded-full mb-6">
                    <FileText className="w-8 h-8 text-growth" />
                  </div>
                  <p className="text-base text-rush-black/60 mb-8">
                    Ask about HIPAA, PTO, infection control, remote work, or any Rush policy
                  </p>

                  {/* Suggested Prompts */}
                  <SuggestedPromptsGrid onPromptClick={handlePromptClick} />
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={generateKey(message.content.substring(0, 50), index)}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
                  style={{ animationDelay: `${index * 50}ms` }}
                  role="article"
                  aria-label={`${message.type === 'user' ? 'Your question' : 'Assistant response'} ${index + 1}`}
                >
                  {message.type === 'user' ? (
                    <div className="flex items-start space-x-3 justify-end max-w-2xl">
                      <div className="bg-gradient-to-br from-navy to-purple rounded-2xl px-5 py-4 shadow-lg hover:shadow-xl transition-shadow border border-navy/20">
                        <p className="text-white font-medium voice-inclusive">{message.content}</p>
                        <p className="text-white/90 text-xs mt-2 font-georgia">{message.timestamp?.toLocaleTimeString()}</p>
                      </div>
                      <div className="w-10 h-10 bg-gradient-to-br from-navy to-purple rounded-xl flex items-center justify-center flex-shrink-0 shadow-md border border-violet/30">
                        <User className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  ) : message.type === 'error' ? (
                    <div className="flex items-start space-x-3 w-full max-w-3xl">
                      <div className="w-10 h-10 bg-gradient-to-br from-blush to-red-400 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                        <AlertTriangle className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="bg-blush/40 border-2 border-red-400 rounded-2xl px-6 py-4 shadow-md">
                          <div className="flex items-center space-x-2 mb-2">
                            <AlertCircle className="w-5 h-5 text-red-700" />
                            <h3 className="font-semibold text-red-900">Error</h3>
                          </div>
                          <p className="text-red-900 leading-relaxed voice-accessible font-georgia">{message.content}</p>
                          <p className="text-red-700 text-xs mt-2">{message.timestamp?.toLocaleTimeString()}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Answer + Source Document Evidence
                    <div className="flex items-start space-x-3 w-full max-w-4xl">
                      <div className="w-10 h-10 bg-gradient-to-br from-growth to-legacy rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 space-y-4">
                        {(() => {
                          const { answer, fullDocument, content, metadata } = parseResponse(message.content);

                          return (
                            <>
                              {/* Answer Section - PART 1 */}
                              {answer && (
                                <div className="answer-section">
                                  <div className="answer-header">
                                    <MessageSquare className="w-5 h-5 text-growth" />
                                    <h3>Answer</h3>
                                  </div>
                                  <div className="answer-content">
                                    <p className="voice-inclusive font-georgia leading-relaxed">{answer}</p>
                                  </div>
                                  <div className="flex justify-end mt-3">
                                    <button
                                      onClick={() => copyToClipboard(answer, `answer-${index}`)}
                                      className="answer-copy-button-inline"
                                      disabled={copiedIndex === `answer-${index}`}
                                      aria-label={copiedIndex === `answer-${index}` ? 'Answer copied to clipboard' : 'Copy answer to clipboard'}
                                      aria-live="polite"
                                    >
                                      {copiedIndex === `answer-${index}` ? (
                                        <>
                                          <CheckCheck className="w-4 h-4" aria-hidden="true" />
                                          <span>Copied</span>
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="w-4 h-4" aria-hidden="true" />
                                          <span>Copy</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* Source Document Evidence Section - PART 2 */}
                              <div className="evidence-section">
                                <div className="evidence-header">
                                  <BookOpen className="w-5 h-5 text-legacy" />
                                  <h3>Source Document Evidence</h3>
                                </div>

                                <div className="pdf-document-container">
                                  {/* PDF Document Header */}
                                  <div className="pdf-header">
                                    <div className="flex items-center justify-between mb-4">
                                      <div className="flex items-center space-x-3">
                                        <img src="/images/rush-logo.jpg" alt="Rush" className="h-8 object-contain" />
                                        <div className="border-l border-rush-gray h-8"></div>
                                        <div>
                                          <h4 className="font-semibold text-legacy text-lg">Rush University Policy Document</h4>
                                          <p className="text-xs text-rush-black/70">PolicyTech Database</p>
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => copyToClipboard(fullDocument, `doc-${index}`)}
                                        className="pdf-copy-button"
                                        disabled={copiedIndex === `doc-${index}`}
                                        aria-label={copiedIndex === `doc-${index}` ? 'Document copied to clipboard' : 'Copy full document to clipboard'}
                                        aria-live="polite"
                                      >
                                        {copiedIndex === `doc-${index}` ? (
                                          <>
                                            <CheckCheck className="w-4 h-4" aria-hidden="true" />
                                            <span>Copied</span>
                                          </>
                                        ) : (
                                          <>
                                            <Copy className="w-4 h-4" aria-hidden="true" />
                                            <span>Copy</span>
                                          </>
                                        )}
                                      </button>
                                    </div>

                                    {/* Metadata Bar */}
                                    {(metadata.policyNumber || metadata.policyTitle || metadata.effectiveDate || metadata.department) && (
                                      <div className="pdf-metadata-bar">
                                        {metadata.policyNumber && (
                                          <span className="pdf-badge">
                                            <FileText className="w-3 h-3" />
                                            Policy #{metadata.policyNumber}
                                          </span>
                                        )}
                                        {metadata.effectiveDate && (
                                          <span className="pdf-badge">
                                            <Clock className="w-3 h-3" />
                                            {metadata.effectiveDate}
                                          </span>
                                        )}
                                        {metadata.department && (
                                          <span className="pdf-badge">
                                            <Building2 className="w-3 h-3" />
                                            {metadata.department}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  {/* PDF Document Body */}
                                  <div className="pdf-body">
                                    {formatDocumentContent(fullDocument)}
                                  </div>

                                  {/* PDF Document Footer */}
                                  <div className="pdf-footer">
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
                                          <span className="font-semibold">Retrieved:</span> {message.timestamp?.toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })}
                                        </div>
                                        <div>
                                          <span className="font-semibold">Property of:</span> Rush University System for Health
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start animate-fade-in-up">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-growth to-legacy rounded-xl flex items-center justify-center flex-shrink-0 shadow-md border border-vitality/40">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div
                    className="bg-sage/40 px-6 py-4 rounded-2xl shadow-md border border-growth/30"
                    role="status"
                    aria-live="polite"
                    aria-label="Loading response"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex space-x-2" aria-hidden="true">
                        <div className="w-2.5 h-2.5 bg-growth rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2.5 h-2.5 bg-vitality rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2.5 h-2.5 bg-legacy rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                      <span className="text-sm text-legacy font-semibold voice-invested">Searching policies...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="border-t border-rush-gray/20 p-6 bg-white">
            <form onSubmit={sendMessage} className="space-y-2">
              <div className="flex space-x-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask a policy question..."
                  className="flex-1 border border-rush-gray/30 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-growth focus:border-growth transition-all bg-white text-rush-black placeholder-rush-gray/60"
                  disabled={isLoading}
                  aria-label="Ask a policy question"
                  maxLength={PERFORMANCE.MAX_MESSAGE_LENGTH}
                />
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed px-6"
                aria-label="Send message"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="ml-2">Searching...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span className="ml-2">Send</span>
                  </>
                )}
              </button>
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="btn-secondary px-4"
                  aria-label="Clear conversation"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Character Counter */}
            {inputValue.length > 0 && (
              <div className="flex justify-end px-1">
                <span
                  className={`text-xs transition-colors ${
                    inputValue.length >= PERFORMANCE.CHARACTER_WARNING_THRESHOLD
                      ? 'text-red-600 font-semibold'
                      : 'text-rush-gray/60'
                  }`}
                  aria-live="polite"
                  aria-label={`${inputValue.length} of ${PERFORMANCE.MAX_MESSAGE_LENGTH} characters`}
                >
                  {inputValue.length} / {PERFORMANCE.MAX_MESSAGE_LENGTH}
                </span>
              </div>
            )}
          </form>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-rush-black/60 border-t border-rush-gray/20">
        <div className="max-w-6xl mx-auto px-6">
          <p>Rush University System for Health • Internal Use Only • Powered by Azure GPT-5 Chat Model</p>
        </div>
      </footer>

      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
