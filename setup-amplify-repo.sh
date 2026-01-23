#!/bin/bash

# Exametry - AWS Amplify Repository Setup Script
# This script helps you push your code to a separate Amplify repository

echo "🚀 Exametry AWS Amplify Repository Setup"
echo "=========================================="
echo ""

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

# Check if Exametry_v1.0.0 branch exists
if ! git show-ref --verify --quiet refs/heads/Exametry_v1.0.0; then
    echo "❌ Error: Exametry_v1.0.0 branch not found"
    exit 1
fi

echo "✅ Git repository detected"
echo "✅ Exametry_v1.0.0 branch found"
echo ""

# Prompt for new repository URL
echo "📝 Enter your new Amplify repository URL:"
echo "   Example: https://github.com/yourusername/exametry-frontend.git"
read -p "Repository URL: " REPO_URL

if [ -z "$REPO_URL" ]; then
    echo "❌ Error: Repository URL cannot be empty"
    exit 1
fi

echo ""
echo "🔗 Adding remote 'amplify' with URL: $REPO_URL"
git remote add amplify "$REPO_URL" 2>/dev/null

if [ $? -ne 0 ]; then
    echo "⚠️  Remote 'amplify' already exists. Updating URL..."
    git remote set-url amplify "$REPO_URL"
fi

echo ""
echo "📤 Pushing Exametry_v1.0.0 branch to amplify remote as 'main'..."
git push amplify Exametry_v1.0.0:main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to Amplify repository!"
    echo ""
    echo "📋 Next Steps:"
    echo "   1. Go to AWS Amplify Console: https://console.aws.amazon.com/amplify/"
    echo "   2. Click 'New app' → 'Host web app'"
    echo "   3. Connect your repository"
    echo "   4. Add environment variables (see AMPLIFY-DEPLOYMENT.md)"
    echo "   5. Deploy!"
    echo ""
    echo "📄 For detailed instructions, see AMPLIFY-DEPLOYMENT.md"
else
    echo ""
    echo "❌ Error: Failed to push to remote repository"
    echo "   Please check:"
    echo "   - Repository URL is correct"
    echo "   - You have push access to the repository"
    echo "   - Repository exists and is initialized"
fi
