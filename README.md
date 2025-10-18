# Rush Policy Chat Assistant 🏥

An AI-powered chat interface for Rush University employees to query official policy documents. Built with Next.js and Azure OpenAI with a **world-class UI/UX**.

## ✨ Features

### 🎨 World-Class UI/UX
- **Modern Design**: Clean, professional interface with Rush University branding
- **Smooth Animations**: Fade-ins, slide transitions, and micro-interactions
- **Suggested Prompts**: Quick-start examples for common policy questions
- **Copy Functionality**: One-click copy for AI responses and policy documents
- **Keyboard Shortcuts**: `⌘K` / `Ctrl+K` to focus input, `Escape` to clear
- **Toast Notifications**: Real-time feedback for user actions
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Accessibility**: WCAG AA compliant with keyboard navigation support

### 🤖 AI-Powered Search
- Natural language policy queries
- Dual-response format: Quick AI summary + Full policy document
- Conversation memory within sessions
- 800+ policy documents indexed

### 🚀 Quick Start on Replit

1. **Set up Secrets** (click Secrets tab in sidebar):
   ```
   AZURE_OPENAI_ENDPOINT=https://prodkmnlpopenaiastus.openai.azure.com/
   AZURE_OPENAI_API_KEY=your-api-key-here
   ASSISTANT_ID=asst_your_assistant_id
   ```

2. **Run the application**:
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5000`

3. **Deploy to production**:
   - Click the "Deploy" button in Replit
   - Choose "Autoscale" deployment
   - Your app will be live in minutes!

## 📚 Documentation

- **[TESTING.md](./TESTING.md)** - Feature testing & E2E validation
- [Replit Deployment Guide](./docs/REPLIT_DEPLOYMENT.md) - Recommended for most users
- [Azure Deployment Guide](./docs/AZURE_DEPLOYMENT.md) - Enterprise production option
- [Full Documentation](./docs/README.md)
- [Contributing Guidelines](./docs/CONTRIBUTING.md)
- [Security Policy](./docs/SECURITY.md)

## Project Structure

```
├── app/              # Next.js app router
├── assets/           # Static assets and documents
├── docs/             # Documentation
├── pages/            # Legacy pages (for Vercel compatibility)
├── scripts/          # Build and utility scripts
└── config files      # Configuration files
```

Built with ❤️ for Rush University Medical Center