# Rush Policy Assistant

An AI-powered chat interface for Rush University System for Health staff to query official policy documents. Built with Next.js 14, Azure GPT-5 Chat Model, and implementing complete Rush University brand guidelines with WCAG AA accessibility compliance.

![Rush University System for Health](https://img.shields.io/badge/Rush-University-006332)
![Next.js](https://img.shields.io/badge/Next.js-14.0-black)
![WCAG](https://img.shields.io/badge/WCAG-AA-30AE6E)
![License](https://img.shields.io/badge/license-MIT-blue)

## ✨ Features

### 🎨 Complete Rush Brand Implementation
- **Official Color Palette**: Legacy Green (#006332), Growth Green (#30AE6E), Vitality Green (#5FEEA2), plus complete accent palette
- **Professional Typography**: Montserrat and Source Sans 3 via Google Fonts, Georgia for documents
- **Brand Voice**: Inclusive, Invested, Inventive, and Accessible messaging throughout
- **Zero Tailwind Defaults**: 100% Rush brand colors, no generic grays

### ♿ WCAG AA Accessibility
- All text contrast ratios exceed 4.5:1 minimum requirement
- Keyboard navigation support (⌘K to focus input)
- ARIA labels and semantic HTML
- Reduced motion support
- Focus states for all interactive elements

### 🚀 Production Features
- **1300+ PolicyTech Documents**: Semantic search through Rush University policies from PolicyTech
- **AI-Powered Responses**: Azure GPT-5 Chat Model with Assistants API
- **Real-time Chat**: Streaming responses with conversation context
- **Copy Functionality**: One-click copy for responses and documents
- **Toast Notifications**: Real-time feedback with accessibility
- **Mobile Responsive**: Optimized for desktop, tablet, and mobile
- **Suggested Prompts**: Quick-start questions for common queries

## 🏗️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, Tailwind CSS
- **AI**: Azure GPT-5 Chat Model (Assistants API)
- **Typography**: Google Fonts (Montserrat, Source Sans 3, Georgia)
- **Icons**: Lucide React
- **Deployment**: Azure Web Apps, Replit (Autoscale), Vercel-ready

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Azure AI account with GPT-5 Chat Model and Assistants API access
- Rush University policy documents vector store (1300+ PolicyTech documents)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/YOUR_USERNAME/rush-policy-assistant.git
cd rush-policy-assistant
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create a `.env.local` file in the root directory:
```env
AZURE_AI_ENDPOINT=your_azure_ai_endpoint
AZURE_AI_AGENT_ID=your_agent_id
# Note: Authentication via Azure CLI or Managed Identity (no API keys required)
```

4. **Run the development server**
```bash
npm run dev
```

Open [http://localhost:5000](http://localhost:5000) in your browser.

## 📁 Project Structure

```
rush-policy-chat/
├── app/
│   ├── api/
│   │   ├── chat/          # Main chat endpoint (Azure OpenAI)
│   │   ├── debug/         # Debugging utilities
│   │   ├── health/        # Health check endpoint
│   │   ├── reset/         # Conversation reset
│   │   └── test-env/      # Environment validation
│   ├── globals.css        # Rush brand styles
│   ├── layout.js          # Root layout with metadata
│   ├── loading.js         # Loading states
│   └── page.js            # Main chat interface
├── docs/                  # Documentation
│   ├── AZURE_DEPLOYMENT.md
│   ├── DEPLOYMENT_COMPARISON.md
│   ├── REPLIT_DEPLOYMENT.md
│   └── SECURITY.md
├── scripts/               # Utility scripts
├── tailwind.config.js     # Rush brand color system
├── next.config.js         # Next.js configuration
└── package.json           # Dependencies
```

## 🎨 Rush Brand System

### Color Palette
```javascript
// Primary Colors
Legacy:    #006332  // Primary green - heritage and trust
Growth:    #30AE6E  // Vibrant green - progress
Vitality:  #5FEEA2  // Bright green - energy
Sage:      #DFF9EB  // Soft green - calm and care

// Accent Colors
Gold:      #FFC60B  // Optimism and excellence
Sky Blue:  #54ADD3  // Innovation and clarity
Navy:      #005D83  // Trust and professionalism
Purple:    #2D1D4E  // Wisdom and dignity
Violet:    #6C43B9  // Creativity and vision
Blush:     #FFE3E0  // Warmth and compassion
Sand:      #F2DBB3  // Comfort and accessibility

// Neutrals
Rush Black: #5F5858  // Primary text
Rush Gray:  #AFAEAF  // Secondary text (use with caution for contrast)
```

### Typography
- **Headings**: Montserrat (weights: 400, 600, 700)
- **Body**: Source Sans 3 (weights: 400, 600, 700)
- **Documents**: Georgia Regular

## 🔒 Security

- Managed Identity authentication (zero API keys stored)
- Azure AI enterprise security with TLS 1.3 encryption
- Input validation and sanitization
- No PHI (Protected Health Information) processing
- Ephemeral conversations (no persistent user data)
- All environment variables secured via Azure Key Vault

See [SECURITY.md](docs/SECURITY.md) for detailed security practices.

## 🚀 Deployment

### Replit (Current)
Deployed on Replit with Autoscale configuration. See [REPLIT_DEPLOYMENT.md](docs/REPLIT_DEPLOYMENT.md) for details.

### Vercel (Alternative)
Ready for one-click Vercel deployment:
```bash
vercel
```

### Azure App Service
Enterprise deployment option. See [AZURE_DEPLOYMENT.md](docs/AZURE_DEPLOYMENT.md) for setup instructions.

## 🧪 Testing

Run the test suite:
```bash
npm test
```

See [TESTING.md](TESTING.md) for comprehensive testing guide.

## 📊 Performance

- **First Load**: ~1.5s
- **Page Weight**: ~350KB (gzipped)
- **Lighthouse Score**: 95+ (Performance, Accessibility, Best Practices)
- **WCAG**: AA Compliant (all contrast ratios exceed 4.5:1)

## 🤝 Contributing

This is an internal Rush University project. See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for development guidelines.

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- Rush University System for Health for brand guidelines
- Azure AI for GPT-5 Chat Model and Assistants API
- Next.js team for the excellent framework

## 📞 Support

For technical issues or questions:
- Internal: Contact IT Support
- Development: See [CONTRIBUTING.md](docs/CONTRIBUTING.md)

---

**Built with ❤️ for Rush University System for Health**
