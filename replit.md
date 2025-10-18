# Overview

The Rush Policy Chat Assistant is a Next.js application that provides AI-powered policy document queries for Rush University Medical Center staff. This is a beta demonstration built to showcase intelligent policy search capabilities using Azure OpenAI GPT-4. The application allows users to search through 800+ policy documents using natural language queries and receive both synthesized answers and full policy details.

**Latest Update (October 2025)**: Enhanced with world-class UI/UX featuring modern animations, suggested prompts, keyboard shortcuts, toast notifications, copy functionality, and full accessibility support (WCAG AA compliant).

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

### Recent UI/UX Enhancements (October 2025)
- **Suggested Prompts**: 4 pre-configured policy questions with category badges for quick start
- **Toast Notifications**: Real-time user feedback with ARIA live regions for accessibility
- **Copy Functionality**: One-click copy for AI responses and full policy documents
- **Keyboard Shortcuts**: ⌘K/Ctrl+K to focus input, Escape to clear
- **Smooth Animations**: Fade-in effects, slide transitions, and micro-interactions
- **Enhanced Loading States**: Contextual messages and pulsing indicators
- **Error Handling**: Clear, actionable error messages with visual feedback
- **Accessibility**: WCAG AA compliant with keyboard navigation, focus states, and reduced motion support
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
- **Google Fonts (Inter)** - Fallback typography when Calibre font is unavailable
- **Custom Tailwind configuration** with Rush University brand colors and typography

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