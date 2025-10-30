# Rush Policy Chat - Project Structure

This document outlines the organized folder structure for the Rush Policy Assistant application.

## 📁 Root Directory

```
rushpolicychatlocal/
├── app/                    # Next.js 14 App Router
├── docs/                   # Project documentation
├── public/                 # Static assets
├── scripts/                # Utility scripts
├── .claude/                # Claude AI assistant configuration
├── .next/                  # Next.js build output (gitignored)
├── node_modules/           # Dependencies (gitignored)
├── CLAUDE.md               # Claude AI development guide
├── README.md               # Main project README
├── DEPLOYMENT.md           # Deployment instructions
├── LICENSE                 # MIT License
└── Configuration files...
```

## 📂 App Directory (`/app`)

Main application code following Next.js 14 App Router conventions:

```
app/
├── api/                    # API Routes
│   ├── azure-agent/       # Azure AI Agent endpoint (PRIMARY)
│   │   ├── route.js       # Main POST handler
│   │   ├── helpers.js     # Retry logic, validation
│   │   ├── security.js    # Rate limiting, input sanitization
│   │   └── systemPrompt.js # Zero-hallucination RAG prompt
│   └── health/            # Health check endpoint
│
├── components/            # React Components
│   ├── chat/             # Chat-specific components
│   │   ├── ChatInput.tsx           # Message input with Send button
│   │   ├── MessageCard.tsx         # Message display component
│   │   ├── SuggestedPrompts.tsx    # Clickable prompt cards
│   │   ├── DocumentViewer.tsx      # Full document modal
│   │   └── PolicyMetadata.tsx      # Policy info display
│   │
│   ├── layout/           # Layout components
│   │   ├── Header.tsx              # App header with branding
│   │   └── MobileDrawer.tsx        # Mobile navigation
│   │
│   ├── ui/               # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── scroll-area.tsx
│   │   ├── sheet.tsx
│   │   ├── textarea.tsx
│   │   └── ... (other UI primitives)
│   │
│   └── ErrorBoundary.tsx # Global error boundary
│
├── hooks/                # Custom React Hooks
│   ├── useToast.ts       # Toast notifications
│   └── useClipboard.ts   # Copy to clipboard functionality
│
├── lib/                  # Utility libraries
│   └── utils.ts          # Helper functions (cn, etc.)
│
├── utils/                # Business logic utilities
│   ├── policyParser.js   # Parse AI responses
│   └── documentFormatter.js # Format policy documents
│
├── constants.js          # Centralized constants
├── globals.css           # Global styles + Tailwind
├── layout.js             # Root layout
├── page.tsx              # Main chat interface (HOME)
├── error.jsx             # Error page
├── global-error.jsx      # Global error page
├── loading.js            # Loading state
└── middleware.js         # Request middleware
```

## 📚 Documentation (`/docs`)

Comprehensive project documentation:

```
docs/
├── README.md                          # Docs overview
├── AZURE_DEPLOYMENT.md                # Azure deployment guide
├── AZURE_DEPLOYMENT_CHECKLIST.md     # Pre-deployment checklist
├── REPLIT_DEPLOYMENT.md               # Replit deployment guide
├── DEPLOYMENT_COMPARISON.md           # Platform comparison
└── SECURITY.md                        # Security considerations
```

## 🛠️ Scripts (`/scripts`)

Utility and testing scripts:

```
scripts/
├── test-azure-agent.js                # Test Azure AI Agent
├── test-assistant.example.js          # Template for assistant testing
├── test-tb-policy.js                  # Test specific policy
├── diagnose-azure-connection.js       # Connection diagnostics
├── azure-agent-example.js             # Example usage
├── deploy-to-azure.sh                 # Azure deployment script
└── verify-deployment.sh               # Post-deployment verification
```

## 🖼️ Public Assets (`/public`)

Static files served directly:

```
public/
├── images/
│   └── rush-logo.jpg     # Rush University logo
└── favicon.ico
```

## ⚙️ Configuration Files (Root)

Essential configuration files:

```
Root/
├── package.json              # Dependencies and scripts
├── package-lock.json         # Locked dependency versions
├── next.config.js            # Next.js configuration
├── tailwind.config.js        # Tailwind CSS + Rush theme
├── postcss.config.js         # PostCSS configuration
├── tsconfig.json             # TypeScript configuration
├── .eslintrc.json            # ESLint rules
├── .gitignore                # Git ignore patterns
├── vercel.json               # Vercel deployment config
├── web.config                # Azure web.config
├── startup.sh                # Startup script
└── middleware.js             # Edge middleware
```

## 🚫 Ignored Files & Directories

The following are automatically excluded from Git (see `.gitignore`):

- `node_modules/` - Dependencies
- `.next/` - Build output
- `.env*.local` - Environment variables
- `*.tsbuildinfo` - TypeScript build cache
- `*.log` - Log files
- `.DS_Store` - macOS system files
- `*.backup`, `*.old`, `*.bak` - Backup files
- `.claude/settings.local.json` - Local AI settings

## 📋 Key Design Principles

### 1. **Separation of Concerns**
- API routes in `/app/api`
- UI components in `/app/components`
- Business logic in `/app/utils`
- Documentation in `/docs`

### 2. **Component Organization**
- **chat/** - Chat-specific features
- **layout/** - Page layout components
- **ui/** - Reusable UI primitives (shadcn/ui)

### 3. **TypeScript Migration**
- New components use `.tsx` extension
- Hooks migrated to `.ts`
- Legacy code remains `.js` until refactored

### 4. **Documentation Structure**
- `CLAUDE.md` - AI development guide (root)
- `README.md` - User-facing documentation
- `/docs` - Detailed technical guides

## 🔄 File Naming Conventions

- **Components**: PascalCase (`ChatInput.tsx`, `MessageCard.tsx`)
- **Utilities**: camelCase (`policyParser.js`, `documentFormatter.js`)
- **Hooks**: camelCase with `use` prefix (`useToast.ts`, `useClipboard.ts`)
- **Constants**: camelCase (`constants.js`)
- **Config**: kebab-case (`next.config.js`, `tailwind.config.js`)

## 📦 Build Output (Ignored)

Build artifacts not tracked in Git:

- `.next/` - Next.js build cache
- `out/` - Static export output
- `dist/` - Distribution builds
- `*.tsbuildinfo` - TypeScript incremental build info

## 🎯 Quick Navigation

| Task | Location |
|------|----------|
| **Add new API route** | `app/api/[name]/route.js` |
| **Create UI component** | `app/components/ui/[name].tsx` |
| **Add chat feature** | `app/components/chat/[name].tsx` |
| **Update styles** | `app/globals.css` or Tailwind config |
| **Add utility function** | `app/utils/[name].js` |
| **Create custom hook** | `app/hooks/use[Name].ts` |
| **Update constants** | `app/constants.js` |
| **Add documentation** | `docs/[TOPIC].md` |
| **Create test script** | `scripts/test-[name].js` |

## 🔍 Finding Files

Common file locations:

```bash
# Main chat interface
app/page.tsx

# Azure AI Agent endpoint
app/api/azure-agent/route.js

# Response parser
app/utils/policyParser.js

# Rush brand colors
tailwind.config.js

# Environment setup
.env.local (create from .env.example)

# Project instructions
CLAUDE.md
```

## 🧹 Maintenance

### Cleaning Build Artifacts
```bash
# Remove build cache
rm -rf .next

# Remove TypeScript build info
rm -f tsconfig.tsbuildinfo

# Clean install dependencies
rm -rf node_modules package-lock.json
npm install
```

### Updating Dependencies
```bash
# Check for outdated packages
npm outdated

# Update packages
npm update

# Update Next.js
npm install next@latest react@latest react-dom@latest
```

---

**Last Updated**: October 29, 2024
**Version**: 2.0.0 (TypeScript Migration + UI/UX Redesign)
