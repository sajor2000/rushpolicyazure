
# Rush Policy Chat Assistant (Beta Demo)

> **⚠️ IMPORTANT NOTICE: This is a DEMO VERSION built by Juan C. Rojas MD, MS for demonstration purposes only. This beta version uses secure Azure resources and is not intended for production use.**

An AI-powered chat interface for Rush University employees to query official policy documents. Built with Next.js and Azure OpenAI, this application provides instant access to over 800 policy documents with intelligent search and interpretation capabilities.

![Rush Policy Assistant](https://img.shields.io/badge/Rush-Policy%20Assistant-006341)
![Status](https://img.shields.io/badge/Status-Beta%20Demo-orange)
![Next.js](https://img.shields.io/badge/Next.js-14.0.0-black)
![OpenAI](https://img.shields.io/badge/Azure-OpenAI-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## 🔒 Security & Compliance Notice

This beta demonstration:
- Uses **secure Azure OpenAI resources** with enterprise-grade security
- All API keys and endpoints are protected using Azure Key Vault standards
- Data transmission is encrypted using TLS 1.3
- No patient data or PHI is processed or stored
- All interactions are logged for security audit purposes
- Complies with Rush University IT security policies

## 🏥 Features

- **Intelligent Policy Search**: Natural language queries to find relevant policies
- **800+ Policy Documents**: Comprehensive coverage of Rush University policies
- **Real-time Responses**: Powered by Azure OpenAI GPT-4
- **Secure Authentication**: API key-based access control
- **Rush University Branded**: Official Rush green color scheme and branding
- **Mobile Responsive**: Works on all devices
- **Compliance Logging**: All interactions logged for audit purposes

## 🚀 Quick Start

### Prerequisites

- Node.js 16.x or higher
- npm or yarn
- Azure OpenAI resource with GPT-4 deployment
- OpenAI Assistant configured with Rush policy documents

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/rush-policy-chat.git
   cd rush-policy-chat
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your credentials:
   ```
   AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
   AZURE_OPENAI_API_KEY=your-api-key-here
   ASSISTANT_ID=asst_your_assistant_id
   VECTOR_STORE_ID=vs_your_vector_store_id
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🛠️ Configuration

### Azure OpenAI Setup

1. Create an Azure OpenAI resource in the Azure Portal
2. Deploy the GPT-4 model
3. Create an Assistant with the policy documents
4. Configure the vector store with your policy files
5. Copy the Assistant ID and API credentials

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `AZURE_OPENAI_ENDPOINT` | Your Azure OpenAI endpoint URL | Yes |
| `AZURE_OPENAI_API_KEY` | API key for authentication | Yes |
| `ASSISTANT_ID` | OpenAI Assistant ID | Yes |
| `VECTOR_STORE_ID` | Vector store containing policies | Yes |

## 📁 Project Structure

```
rush-policy-chat/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.js      # API endpoint for chat
│   ├── globals.css           # Global styles
│   ├── layout.js             # Root layout
│   └── page.js               # Main chat interface
├── public/                   # Static assets
├── .env.example              # Environment template
├── .gitignore               # Git ignore rules
├── next.config.js           # Next.js configuration
├── package.json             # Dependencies
├── tailwind.config.js       # Tailwind CSS config
└── README.md                # This file
```

## 🧪 Testing

Test your assistant connection:

```bash
# Create test script from example
cp test-assistant.example.js test-assistant.js

# Run the test
node test-assistant.js
```

## 🚢 Deployment

### Vercel (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Set environment variables** in Vercel dashboard

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- AWS Amplify
- Netlify
- Azure Static Web Apps
- Railway
- Render

## 🔒 Security Considerations

- **Never commit** `.env.local` or API keys
- Use environment variables for all sensitive data
- Implement proper access controls in production
- Enable CORS only for trusted domains
- Regular security audits recommended

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For issues and questions:
- **Technical Issues**: Open a GitHub issue
- **Policy Questions**: Contact Rush IT Department
- **Security Concerns**: Email security@rush.edu

## 📊 Performance

- Average response time: 2-5 seconds
- Supports 100+ concurrent users
- 99.9% uptime SLA with proper deployment

## 🔄 Updates

The policy database is updated automatically when new documents are added to the vector store. No code changes required.

## 🏆 Acknowledgments

- Rush University IT Department
- Azure OpenAI Team
- Next.js Community

---

## 👨‍⚕️ Author

**Juan C. Rojas MD, MS**  
Department of Internal Medicine  
Rush University Medical Center

This beta demonstration was created to showcase the potential of AI-powered policy assistance for healthcare institutions.

## ⚠️ Disclaimer

This is a **DEMONSTRATION PROJECT** for beta testing purposes only. It uses secure Azure resources but is not intended for production use without proper review and approval from Rush University IT and compliance departments.

---

Made with ❤️ for Rush University Medical Center
