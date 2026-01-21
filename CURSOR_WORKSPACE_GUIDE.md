# Simple Password Login - Cursor Workspace Guide

## ✅ This Project is Completely Separate from ex_ch_10224

### Git Configuration
```
Remote: origin → https://github.com/DevAlchemyHQ/simple-password-login-deploy.git
Branch: main (tracking origin/main)
```

**No connection to ex_ch_10224 repository!**

---

## 🚀 How to Open This Project in Cursor

### Method 1: Open Folder (Recommended)
1. Open Cursor
2. Click **File → Open Folder** (or `Cmd+O` on Mac)
3. Navigate to: `/Users/timn./Cusor Projects/simple-password-login`
4. Click "Open"

### Method 2: From Terminal
```bash
# Open this project in Cursor:
cursor "/Users/timn./Cusor Projects/simple-password-login"

# Or navigate and open:
cd "/Users/timn./Cusor Projects/simple-password-login"
cursor .
```

### Method 3: From Cursor Command Palette
1. Press `Cmd+Shift+P`
2. Type "Open Folder"
3. Select this folder

---

## 📋 Daily Workflow

### Making Changes and Deploying:

```bash
# 1. Make your code changes in Cursor

# 2. Stage and commit:
git add .
git commit -m "Your commit message"

# 3. Push to deploy (triggers Amplify automatically):
git push

# That's it! Amplify will deploy automatically to:
# https://main.d26ydk99jowugs.amplifyapp.com
```

### Check Deployment Status:
```bash
# View recent deployments:
aws amplify list-jobs --app-id d26ydk99jowugs --branch-name main --region eu-west-2 --max-items 5
```

---

## 🔍 Verify This is Independent

Run these commands to confirm separation:

```bash
# Check git remote (should only show simple-password-login-deploy):
git remote -v

# Check branch tracking:
git branch -vv

# Check current directory:
pwd
```

**Expected output:**
- Remote: `origin` → `simple-password-login-deploy.git` only
- No `ex_ch_backup` or `ex_ch_10224` remotes
- Directory: `/Users/timn./Cusor Projects/simple-password-login`

---

## 📁 Project Structure

```
simple-password-login/
├── src/
│   ├── components/          # React components
│   ├── store/              # Zustand state management
│   ├── utils/              # Utility functions
│   ├── hooks/              # Custom React hooks
│   └── types/              # TypeScript types
├── public/                 # Static assets
├── supabase/               # Database migrations
├── package.json            # Dependencies
├── vite.config.ts          # Vite configuration
└── amplify.yml             # AWS Amplify build config
```

---

## 🌐 Deployment Info

- **Amplify App ID:** d26ydk99jowugs
- **Live URL:** https://main.d26ydk99jowugs.amplifyapp.com
- **Region:** eu-west-2
- **Auto-deploy:** Enabled on push to `main`

---

## ⚡ Quick Commands

```bash
# Install dependencies:
npm install

# Run locally:
npm run dev

# Build for production:
npm run build

# Lint code:
npm run lint

# Push and deploy:
git push
```

---

## 📝 Notes

- This workspace is completely independent from `ex_ch_10224`
- No shared git history or remotes
- Separate Cursor project configuration
- Separate node_modules and dependencies

---

**Last Updated:** 2026-01-21
