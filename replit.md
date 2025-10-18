# Overview

The Rush Policy Chat Assistant is a Next.js application that provides AI-powered policy document queries for Rush University Medical Center staff. This is a beta demonstration built to showcase intelligent policy search capabilities using Azure OpenAI GPT-4. The application allows users to search through 800+ policy documents using natural language queries and receive both synthesized answers and full policy details.

**Latest Update (October 18, 2025)**: Complete Rush University brand implementation with official color palette, modern web typography, WCAG AA accessibility compliance, and brand voice integration. The application now fully reflects Rush's visual identity and personality (Inclusive, Invested, Inventive, Accessible) across every interaction.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

The application uses Next.js 14 with the App Router architecture for modern React development. The UI is built with:

- **Component-based React architecture** with functional components and hooks for state management
- **Tailwind CSS styling** with custom Rush University branding colors (growth green, legacy green, vitality green) and typography using the Calibre font family
- **Client-side conversation state** managed in React with real-time message streaming
- **Mobile-responsive design** optimized for healthcare staff using various devices
- **Lucide React icons** for consistent iconography throughout the interface

### Rush Brand Implementation (October 18, 2025)

**Official Color Palette Integration:**
- **Primary Colors**: Legacy #006332, Growth #30AE6E, Vitality #5FEEA2, Sage #DFF9EB
- **Accent Colors**: Gold #FFC60B, Sky Blue #54ADD3, Navy #005D83, Purple #2D1D4E, Violet #6C43B9, Blush #FFE3E0, Sand #F2DBB3
- **Neutrals**: Rush Black #5F5858 for all body text
- **Zero Tailwind defaults**: All gray tokens replaced with Rush brand colors

**Typography System:**
- **Primary Font**: Montserrat (weights 400, 600, 700) via Google Fonts as professional Calibre alternative
- **Secondary Font**: Source Sans 3 (weights 400, 600, 700) for fallback support
- **Document Font**: Georgia Regular for policy document rendering
- **Accessibility**: All text meets WCAG AA contrast requirements (minimum 4.5:1)

**Brand Voice Integration:**
- **Inclusive**: Collaborative, supportive language ("We're here to help")
- **Invested**: Action-oriented prompts ("How do I..." vs "What is...")
- **Inventive**: Optimistic, forward-looking messaging ("Let's find the policy answers you need")
- **Accessible**: Plain language, conversational tone throughout

**UI/UX Features:**
- **Suggested Prompts**: 4 pre-configured policy questions with category badges
- **Toast Notifications**: Real-time user feedback with ARIA live regions
- **Copy Functionality**: One-click copy for AI responses and full policy documents
- **Keyboard Shortcuts**: ⌘K/Ctrl+K to focus input, Escape to clear
- **Smooth Animations**: Fade-in effects, slide transitions, and micro-interactions
- **Enhanced Loading States**: Contextual messages with Rush brand colors
- **Error Handling**: Clear, actionable error messages with visual feedback
- **WCAG AA Compliance**: All contrast ratios exceed 4.5:1, keyboard navigation, focus states, reduced motion support
- **Responsive Design**: Optimized for desktop (1920x1080), tablet (768x1024), and mobile (375x667)

## Backend Architecture

The API layer follows Next.js API Routes pattern with several key endpoints:

- **Chat endpoint** (`/api/chat`) handles conversation management and Azure OpenAI integration
- **Health monitoring** (`/api/health`) provides basic application status
- **Debug endpoint** (`/api/debug`) tests Azure connectivity and diagnoses configuration issues
- **Environment testing** (`/api/test-env`) validates configuration without exposing sensitive data
- **Conversation reset** (`/api/reset`) allows users to start fresh conversations

The backend implements a **stateless design** with in-memory thread storage for demo purposes, though production would require persistent storage.

## Data Architecture

The application uses:

- **Azure OpenAI Assistants API** for conversation management and policy document retrieval
- **Vector store** containing 800+ Rush University policy documents for semantic search
- **Thread-based conversations** maintaining context across multiple queries
- **No persistent user data storage** - conversations are ephemeral for security

## Security Architecture

- **Environment-based configuration** with all sensitive data stored in environment variables
- **Azure OpenAI enterprise security** with API key authentication
- **TLS 1.3 encryption** for all data transmission
- **Input validation and sanitization** on all user inputs
- **No PHI processing** designed specifically to avoid patient data

# External Dependencies

## Core Framework Dependencies

- **Next.js 14.0.0** - React framework providing both frontend and API backend capabilities
- **React 18.2.0** and **React DOM 18.2.0** - Core frontend library for component-based UI
- **Tailwind CSS 3.3.5** with PostCSS and Autoprefixer for utility-first styling and browser compatibility

## AI and OpenAI Integration

- **Azure OpenAI SDK (openai 4.0.0)** - Official OpenAI library configured for Azure endpoints
- **Azure OpenAI Assistants API** - Manages conversation threads and document retrieval
- **Custom vector store** containing Rush University policy documents for semantic search

## Styling and UI Dependencies

- **Lucide React 0.263.1** - Icon library providing consistent iconography
- **Google Fonts**: Montserrat (400, 600, 700) and Source Sans 3 (400, 600, 700) as professional Calibre alternatives, Georgia for document typography
- **Custom Tailwind configuration** with complete Rush University official brand palette and WCAG AA compliant color combinations

## Development and Build Tools

- **dotenv 16.5.0** - Environment variable management for local development
- **PostCSS and Autoprefixer** - CSS processing and browser compatibility
- **ESLint integration** through Next.js for code quality

## Azure Cloud Services

- **Azure OpenAI Service** - Production-grade AI service with enterprise security
- **Azure Key Vault standards** - Secure credential management (recommended for production)
- **Azure App Service** - Optional production deployment target with enterprise features

## Deployment Platforms

- **Replit** - Primary deployment platform with integrated development environment and auto-scaling
- **Vercel** - Alternative deployment with edge functions and global CDN
- **Azure App Service** - Enterprise production option with advanced compliance features

The application is optimized for healthcare environments with HIPAA considerations, audit logging capabilities, and enterprise-grade security through Azure infrastructure.