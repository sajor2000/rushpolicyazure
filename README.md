# Rush Policy Chat Assistant

A Next.js application for querying Rush University policy documents using Azure OpenAI. Optimized for Replit deployment with Azure production options.

## 🚀 Quick Start on Replit

1. **Set up Secrets** (click Secrets tab in sidebar):
   ```
   AZURE_OPENAI_ENDPOINT=https://prodkmnlpopenaiastus.openai.azure.com/
   AZURE_OPENAI_API_KEY=your-api-key-here
   ASSISTANT_ID=asst_your_assistant_id
   VECTOR_STORE_ID=vs_your_vector_store_id
   ```

2. **Run the application**:
   ```bash
   npm run dev
   ```

3. **Deploy to production**:
   - Click the "Deploy" button
   - Choose "Autoscale" deployment
   - Your app will be live in minutes!

## 📚 Documentation

- [Replit Deployment Guide](./docs/REPLIT_DEPLOYMENT.md) - **Recommended for most users**
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