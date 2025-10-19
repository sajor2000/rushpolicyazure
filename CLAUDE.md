# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Rush Policy Assistant is a Next.js 14 application providing AI-powered chat interface for Rush University System for Health staff to query 1300+ official PolicyTech documents. The application uses Azure GPT-5 Chat Model via Azure AI Agent with complete Rush University brand implementation and WCAG AA accessibility compliance.

## Development Commands

### Essential Commands
```bash
# Development
npm run dev              # Start dev server (default port: 5000)

# Production
npm run build            # Build for production (creates .next/standalone)
npm start                # Start production server

# Code Quality
npm run lint             # Run Next.js linter
```

### Testing
```bash
# Test Azure AI Agent connection
node scripts/test-azure-agent.js

# Test assistant (template provided)
# Copy scripts/test-assistant.example.js and configure with your credentials
```

## Architecture Overview

### AI Backend System
The application uses Azure GPT-5 Chat Model via Azure AI Agent:

1. **Azure AI Agent** (Production): Uses `@azure/ai-projects` SDK with `DefaultAzureCredential`
   - Endpoint: [app/api/azure-agent/route.js](app/api/azure-agent/route.js)
   - Model: Azure GPT-5 Chat (latest generation)
   - Authenticates via Azure credentials (CLI, Managed Identity, Environment Variables)
   - Agent ID: `asst_301EhwakRXWsOCgGQt276WiU` (Policy_Tech_V1)
   - Thread management: **Stateless** (fresh thread created for every request - zero conversation history)
   - RAG Architecture: Every question triggers fresh database search with no context bleed-over
   - Zero API keys required (Managed Identity authentication)

### Response Format Protocol
Both AI endpoints expect responses in a structured format:
```
SYNTHESIZED_ANSWER:
[2-3 paragraph conservative, factual answer]

FULL_POLICY_DOCUMENT:
[Complete policy text with metadata]
```

The frontend parser ([app/page.js:79-107](app/page.js#L79-L107)) extracts:
- Synthesized answer (user-facing summary)
- Full document text (expandable section)
- Metadata: policy number, effective date, department, key sections

### Frontend Architecture
- **Single Page App**: [app/page.js](app/page.js) - Main chat interface with state management
- **Client-side only**: Uses `'use client'` directive for interactive features
- **State Management**: React hooks (useState, useRef, useEffect)
- **No backend state**: Conversations stored in API route memory (ephemeral)

### API Routes Structure
```
app/api/
├── azure-agent/     # Azure AI Projects agent endpoint
├── chat/            # OpenAI Assistant endpoint
├── debug/           # Debugging utilities
├── health/          # Health check endpoint
├── reset/           # Conversation reset endpoint
└── test-env/        # Environment validation endpoint
```

## RAG Architecture & Zero-Hallucination Design

### Critical Design Principles

**The system is optimized for maximum RAG accuracy and zero hallucinations through:**

1. **Stateless Thread Architecture** ([app/api/azure-agent/route.js:15-23](app/api/azure-agent/route.js#L15-L23))
   - Every request creates a fresh conversation thread
   - No thread storage or caching between requests
   - Zero conversation history between questions
   - Ensures every query triggers a fresh RAG database search

2. **Zero-Hallucination Prompt Engineering** ([app/api/azure-agent/route.js:56-76](app/api/azure-agent/route.js#L56-L76))
   - Explicit instructions to never paraphrase or infer
   - Forbidden phrases list to prevent common hallucination patterns
   - Requirement for verbatim quotes with citations
   - Fallback message when information not in RAG database

3. **RAG Accuracy Monitoring** ([app/api/azure-agent/route.js:253-293](app/api/azure-agent/route.js#L253-L293))
   - Citation count validation (warns if zero citations)
   - Fresh thread confirmation logging
   - Response structure validation (two-part format)
   - Suspicious phrase detection (e.g., "I believe", "typically")

4. **Response Post-Processing** ([app/api/azure-agent/route.js:227-248](app/api/azure-agent/route.js#L227-L248))
   - Extracts citation marks 【source†file.pdf】 from body
   - Removes `**` markdown formatting
   - Cleans excessive whitespace
   - Relocates citations to dedicated footer section

### Why This Matters

**Problem**: Traditional conversational AI can hallucinate when:
- Using previous conversation context instead of searching fresh
- Paraphrasing policy text instead of quoting verbatim
- Inferring information not present in source documents

**Solution**: Our stateless architecture ensures:
- ✅ Every question = fresh RAG search
- ✅ No context bleed-over between questions
- ✅ Only verbatim quotes from PolicyTech documents
- ✅ Citations prove every factual statement

### Monitoring & Validation

Check server logs for RAG validation markers:
```
✅ RAG VALIDATION: Found 3 citations
✅ RAG VALIDATION: Fresh thread created for this request (ID: thread_abc123)
✅ RAG VALIDATION: Response has correct two-part structure
⚠️ RAG WARNING: No citations found in response - possible hallucination
⚠️ RAG WARNING: Response contains suspicious phrases: ['typically']
```

## Environment Configuration

### Required for Azure AI Agent (Primary)
```env
AZURE_AI_ENDPOINT=https://rua-nonprod-ai-innovation.services.ai.azure.com/api/projects/rua-nonprod-ai-innovation-project
AZURE_AI_AGENT_ID=asst_301EhwakRXWsOCgGQt276WiU
```

### Optional for OpenAI Assistant
```env
AZURE_OPENAI_API_KEY=your_key_here
AZURE_OPENAI_ENDPOINT=https://your-endpoint.openai.azure.com/
ASSISTANT_ID=asst_xxxxxxxxxxxxx
```

### Azure Authentication Methods (for Azure AI Agent)
`DefaultAzureCredential` tries in order:
1. Environment variables (`AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `AZURE_TENANT_ID`)
2. Managed Identity (when deployed to Azure)
3. Azure CLI (`az login`)
4. VS Code Azure extension

## Rush Brand System

### Critical Brand Rules
- **Zero Tailwind defaults**: All colors must use Rush palette (no `bg-gray-500`, etc.)
- **Typography**: Montserrat (headings), Source Sans 3 (body), Georgia (documents)
- **Color usage**: Use semantic color names from [tailwind.config.js:11-38](tailwind.config.js#L11-L38)
- **Brand voice**: Inclusive, Invested, Inventive, Accessible

### Color Palette ([tailwind.config.js:11-38](tailwind.config.js#L11-L38))
```javascript
Primary:  'legacy' (#006332), 'growth' (#30AE6E), 'vitality' (#5FEEA2), 'sage' (#DFF9EB)
Accents:  'gold' (#FFC60B), 'sky-blue' (#54ADD3), 'navy' (#005D83), 'purple' (#2D1D4E)
Neutrals: 'rush-black' (#5F5858), 'rush-gray' (#AFAEAF)
```

### Accessibility Requirements
- All text must meet WCAG AA contrast ratios (4.5:1 minimum)
- Keyboard navigation support (⌘K to focus input, Escape to clear)
- ARIA labels on all interactive elements
- Focus states for all clickable elements
- Reduced motion support via `prefers-reduced-motion`

## Key Features & Implementation

### Suggested Prompts System
- Defined in [app/page.js:31-36](app/page.js#L31-L36)
- Each prompt has: icon (Lucide), text, category
- Categories: Compliance & Privacy, Clinical Guidance, Workforce & HR, Time Away
- Clicking a prompt auto-populates and submits the question

### Copy Functionality
- Implemented for both synthesized answers and full documents
- Uses Clipboard API with toast feedback
- Graceful degradation if clipboard access denied

### Toast Notifications
- Positioned fixed at top-right
- Auto-dismiss after 3 seconds
- Types: success (green), error (red), info (blue)
- Accessible with aria-live regions

### Thread Management

**Azure AI Agent (Primary)**:
- **Stateless architecture**: Creates a fresh thread for EVERY request
- **No thread reuse**: Zero conversation history between questions
- **No thread storage**: Threads are never cached or persisted
- **Purpose**: Ensures every query triggers a fresh RAG database search for maximum accuracy

**OpenAI Assistant (Legacy)**:
- **Stateful architecture**: Maintains conversation context via threads
- **Thread creation**: On first message or after reset
- **Thread reuse**: Same thread for subsequent messages in conversation
- **Thread reset**: Via "Clear Conversation" button
- **Storage**: In-memory (lost on server restart)

**Note**: The Azure AI Agent's stateless design prevents hallucinations by forcing fresh RAG searches. The OpenAI Assistant endpoint maintains state for conversational continuity but may be less accurate for policy retrieval.

## Deployment

### Build Configuration
- **Output**: Standalone mode (`output: 'standalone'` in [next.config.js:5](next.config.js#L5))
- **Build artifacts**: `.next/standalone/` directory
- **Port**: 5000 (dev), dynamic (production)

### Supported Platforms
1. **Replit**: Autoscale deployment (current)
2. **Vercel**: One-click deployment ready
3. **Azure App Service**: Enterprise option (see [docs/AZURE_DEPLOYMENT.md](docs/AZURE_DEPLOYMENT.md))

### Deployment Files
- [docs/REPLIT_DEPLOYMENT.md](docs/REPLIT_DEPLOYMENT.md) - Replit deployment guide
- [docs/AZURE_DEPLOYMENT.md](docs/AZURE_DEPLOYMENT.md) - Azure App Service guide
- [docs/DEPLOYMENT_COMPARISON.md](docs/DEPLOYMENT_COMPARISON.md) - Platform comparison

## Common Development Patterns

### Adding New API Endpoints
1. Create folder in `app/api/[endpoint-name]/`
2. Create `route.js` with named exports: `GET`, `POST`, etc.
3. Return `NextResponse.json()` for JSON responses
4. Handle errors gracefully with user-friendly messages

### Modifying Response Parser
The response parser is critical for UI display. When modifying:
1. Update regex patterns in [app/page.js:79-107](app/page.js#L79-L107)
2. Test with actual AI responses
3. Ensure metadata extraction works for policy numbers, dates, departments
4. Validate section extraction for quick reference

### Styling New Components
1. Use Rush color palette exclusively (from tailwind.config.js)
2. Add component classes to [app/globals.css](app/globals.css) under `@layer components`
3. Follow existing patterns: `.btn-primary`, `.btn-secondary`, `.card-hover`
4. Test contrast ratios for accessibility

### AI Backend Integration
When modifying AI integration:
1. Maintain structured response format (SYNTHESIZED_ANSWER, FULL_POLICY_DOCUMENT)
2. Update both endpoints if changing protocol
3. Test thread creation and reuse
4. Implement proper error handling with actionable messages
5. Log important events for debugging

## Security Considerations

- **No PHI processing**: Application does not handle Protected Health Information
- **Ephemeral conversations**: No persistent storage of user queries
- **Environment variables**: Never commit `.env.local` or credentials
- **Azure security**: TLS 1.3 encryption, enterprise-grade authentication
- **Input validation**: All user inputs sanitized before processing
- **CORS**: Configured in [next.config.js](next.config.js) for API routes

## Performance Notes

- **First load**: Target < 1.5s
- **Page weight**: ~350KB gzipped
- **Lighthouse score**: 95+ for Performance, Accessibility, Best Practices
- **Animations**: 60fps target, respects `prefers-reduced-motion`
- **Scroll behavior**: Smooth scrolling with `scrollIntoView`

## Troubleshooting

### Azure AI Agent not working
1. Check Azure credentials: `az login` or set environment variables
2. Verify agent ID matches deployed agent
3. Check endpoint URL format (must include `/api/projects/...`)
4. Review [scripts/test-azure-agent.js](scripts/test-azure-agent.js) for standalone testing

### OpenAI Assistant not available
This is expected if credentials not configured. The app gracefully shows:
- "OpenAI Assistant not available" message
- Suggestion to switch to Azure AI Agent
- Returns HTTP 503 with helpful error details

### Build failures
- Ensure Node.js 18+ installed
- Run `npm install` to ensure all dependencies present
- Check for missing environment variables (though app should run without them)

### Styling inconsistencies
- Verify all colors use Rush palette (search for hardcoded hex values)
- Check [app/globals.css](app/globals.css) for conflicting rules
- Validate Tailwind config in [tailwind.config.js](tailwind.config.js)
