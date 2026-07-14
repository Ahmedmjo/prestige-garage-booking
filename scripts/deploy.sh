#!/bin/bash
# ════════════════════════════════════════════════════════════════
# 🚀 Prestige Garage AI-OS — Deployment Script
# This script guides you through deploying to GitHub + Vercel
# ════════════════════════════════════════════════════════════════

set -e

echo "🎯 Prestige Garage AI-OS — Deployment Guide"
echo "═══════════════════════════════════════════"
echo ""

# Check if gh CLI is available
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed."
    echo "   Install it from: https://cli.github.com/"
    echo "   Or use the web interface: https://github.com/new"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "🔐 You need to authenticate with GitHub first."
    echo "   Run: gh auth login"
    echo "   Or create a Personal Access Token at:"
    echo "   https://github.com/settings/tokens/new?scopes=repo,read:org"
    echo ""
    read -p "Have you completed authentication? (y/N): " auth_done
    if [[ $auth_done != "y" && $auth_done != "Y" ]]; then
        echo "Please authenticate first, then re-run this script."
        exit 1
    fi
fi

# Get repository name
read -p "📝 Enter repository name (default: prestige-garage-ai-os): " REPO_NAME
REPO_NAME=${REPO_NAME:-prestige-garage-ai-os}

# Get visibility
read -p "🔒 Make repository private? (Y/n): " VISIBILITY
VISIBILITY=${VISIBILITY:-private}

if [[ $VISIBILITY == "n" || $VISIBILITY == "N" ]]; then
    VISIBILITY_FLAG="--public"
else
    VISIBILITY_FLAG="--private"
fi

echo ""
echo "📦 Creating GitHub repository: $REPO_NAME"
echo "   Visibility: $VISIBILITY_FLAG"
echo ""

# Create the repository and push
gh repo create "$REPO_NAME" $VISIBILITY_FLAG --source=. --remote=origin --push

echo ""
echo "✅ Repository created and code pushed!"
echo ""
echo "🔗 Repository URL: $(gh repo view --json url -q .url)"
echo ""
echo "═══════════════════════════════════════════"
echo "🚀 Next: Deploy to Vercel"
echo "═══════════════════════════════════════════"
echo ""
echo "Option 1: Via Vercel Dashboard (Recommended)"
echo "1. Go to: https://vercel.com/new"
echo "2. Select your GitHub account"
echo "3. Find and select: $REPO_NAME"
echo "4. Vercel will auto-detect Next.js"
echo "5. Add Environment Variable:"
echo "   DATABASE_URL = file:./db/custom.db"
echo "6. Click 'Deploy'"
echo ""
echo "Option 2: Via Vercel CLI"
echo "1. Install: npm i -g vercel"
echo "2. Run: vercel"
echo "3. Follow the prompts"
echo ""
echo "═══════════════════════════════════════════"
echo "✨ Your app will be live in ~2 minutes!"
echo "═══════════════════════════════════════════"
