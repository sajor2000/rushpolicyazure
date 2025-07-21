#!/bin/bash

# Replace YOUR_GITHUB_USERNAME with your actual GitHub username
# Replace REPO_NAME with your repository name if different from rush-policy-chat

echo "Setting up GitHub remote..."
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/rush-policy-chat.git

echo "Pushing to GitHub..."
git branch -M main
git push -u origin main

echo "Done! Your code is now on GitHub."
echo ""
echo "Next steps for Vercel deployment:"
echo "1. Go to https://vercel.com/new"
echo "2. Import your GitHub repository"
echo "3. Add these environment variables in Vercel:"
echo "   - AZURE_OPENAI_ENDPOINT"
echo "   - AZURE_OPENAI_API_KEY"
echo "   - ASSISTANT_ID"
echo "   - VECTOR_STORE_ID"
echo "4. Deploy!"