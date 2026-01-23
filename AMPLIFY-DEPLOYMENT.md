# AWS Amplify Deployment Guide

This guide will help you deploy the Exametry frontend to a separate AWS Amplify repository.

---

## Prerequisites

- AWS Account with Amplify access
- GitHub account (or GitLab/Bitbucket)
- AWS CLI configured (optional, for CLI deployment)

---

## Step 1: Create New Repository

### Option A: GitHub (Recommended)

1. Go to https://github.com/new
2. Create a new repository:
   - **Name:** `exametry-frontend` (or your preferred name)
   - **Visibility:** Private (recommended for production)
   - **Initialize:** Do NOT initialize with README, .gitignore, or license
3. Copy the repository URL (e.g., `https://github.com/yourusername/exametry-frontend.git`)

### Option B: GitLab or Bitbucket

Follow similar steps on your preferred Git hosting platform.

---

## Step 2: Push Code to New Repository

Run these commands from your current project directory:

```bash
# Add the new repository as a remote
git remote add amplify https://github.com/yourusername/exametry-frontend.git

# Push the Exametry_v1.0.0 branch to the new repository
git push amplify Exametry_v1.0.0:main

# Verify the push
git remote -v
```

**Note:** This pushes your `Exametry_v1.0.0` branch as the `main` branch in the new repository.

---

## Step 3: Set Up AWS Amplify

### Via AWS Console (Recommended):

1. **Navigate to AWS Amplify:**
   - Go to https://console.aws.amazon.com/amplify/
   - Ensure you're in the correct region (e.g., `eu-west-2` - London)

2. **Create New App:**
   - Click "New app" → "Host web app"
   - Choose your Git provider (GitHub, GitLab, or Bitbucket)
   - Authorize AWS Amplify to access your repositories

3. **Connect Repository:**
   - Select your new repository (`exametry-frontend`)
   - Choose the `main` branch
   - Click "Next"

4. **Configure Build Settings:**
   - App name: `Exametry`
   - Environment: `production` (or `dev` for testing)
   - Build settings will auto-detect from `amplify.yml`
   - Click "Next"

5. **Add Environment Variables:**
   Click "Advanced settings" and add these variables:

   ```
   VITE_AWS_REGION=eu-west-2
   VITE_COGNITO_USER_POOL_ID=eu-west-2_Jl6I12sA6
   VITE_COGNITO_CLIENT_ID=1bphman689t3aiurmt4bkup7am
   VITE_API_GATEWAY_URL=https://3hbkcdkri1.execute-api.eu-west-2.amazonaws.com
   VITE_STRIPE_PUBLIC_KEY=pk_test_51QnT9EFTDQ77skgMZr8z4xO8yVCH7YHf8KCLJvW0cqxY3VwXb5PnQN8X5XfWxN7E8qY3u0nWxF7vW0H7
   VITE_FRONTEND_URL=https://your-app-url.amplifyapp.com
   ```

   **Important:** Update `VITE_FRONTEND_URL` after deployment with your actual Amplify URL.

6. **Review and Deploy:**
   - Review all settings
   - Click "Save and deploy"
   - Amplify will start building and deploying your app

---

## Step 4: Update Backend Configuration

After deployment, you need to update the backend Lambda to use your Amplify URL:

### Update Lambda Environment Variable:

1. **Get Your Amplify URL:**
   - After deployment, copy your Amplify URL (e.g., `https://main.d123abc456.amplifyapp.com`)

2. **Update Frontend URL in Backend:**
   ```bash
   cd infrastructure
   
   # Update the FRONTEND_URL in your .env or directly in CDK
   # Edit lib/infrastructure-stack.ts if needed
   
   # Redeploy the backend with updated FRONTEND_URL
   npx cdk deploy
   ```

3. **Or Update Lambda Directly via AWS Console:**
   - Go to Lambda Console
   - Find `exametry-subscription-checkout-dev`
   - Configuration → Environment variables
   - Update `FRONTEND_URL` to your Amplify URL
   - Click "Save"

### Update Stripe Webhook URL:

1. Go to Stripe Dashboard: https://dashboard.stripe.com/test/webhooks
2. Update the webhook endpoint if needed
3. Ensure it points to your API Gateway URL (not the frontend)

---

## Step 5: Configure Custom Domain (Optional)

1. **In AWS Amplify Console:**
   - Select your app
   - Go to "Domain management"
   - Click "Add domain"

2. **Add Your Domain:**
   - Enter your domain (e.g., `app.exametry.com`)
   - Follow the DNS configuration steps
   - Wait for SSL certificate provisioning

3. **Update Environment Variables:**
   - Update `VITE_FRONTEND_URL` to your custom domain
   - Redeploy: Amplify → Redeploy this version

---

## Step 6: Enable Continuous Deployment

AWS Amplify automatically deploys on every push to the `main` branch.

### To Deploy Updates:

```bash
# Make your changes
git add .
git commit -m "Your changes"

# Push to the Amplify repository
git push amplify Exametry_v1.0.0:main
```

Amplify will automatically:
1. Detect the push
2. Run the build
3. Deploy the new version
4. Make it live

---

## Step 7: Switch to Production (When Ready)

### Update Stripe Keys:

1. **Get Live Keys from Stripe:**
   - Go to https://dashboard.stripe.com
   - Switch to "Live mode"
   - Go to Developers → API keys
   - Copy Publishable key

2. **Update Amplify Environment Variables:**
   - Go to Amplify Console → Environment variables
   - Update `VITE_STRIPE_PUBLIC_KEY` to live key
   - Trigger redeploy

3. **Update Backend:**
   - Update Stripe secret key in AWS Secrets Manager
   - Redeploy CDK stack

### Update Webhook:

1. Create new webhook endpoint in Stripe (Live mode)
2. Point to your production API Gateway
3. Update webhook secret in AWS Secrets Manager

---

## Monitoring and Troubleshooting

### View Build Logs:
1. Go to AWS Amplify Console
2. Select your app
3. Click on a deployment
4. View "Build logs"

### Common Issues:

**Build Fails:**
- Check build logs in Amplify Console
- Verify all environment variables are set correctly
- Ensure `amplify.yml` is in the repository root

**App Shows Blank Page:**
- Check browser console for errors
- Verify API Gateway URL is correct
- Check Cognito User Pool ID and Client ID

**Authentication Fails:**
- Verify Cognito configuration
- Check that User Pool and Client ID match
- Ensure API Gateway URL is correct

---

## Useful AWS CLI Commands

```bash
# List all Amplify apps
aws amplify list-apps --region eu-west-2

# Trigger a new deployment
aws amplify start-job --app-id YOUR_APP_ID --branch-name main --job-type RELEASE --region eu-west-2

# Get app details
aws amplify get-app --app-id YOUR_APP_ID --region eu-west-2
```

---

## Repository Structure

After pushing to the new repository, it should contain:

```
exametry-frontend/
├── amplify.yml                 # Amplify build configuration
├── package.json                # Dependencies
├── vite.config.ts             # Vite configuration
├── index.html                 # Entry point
├── src/                       # Source code
│   ├── components/
│   ├── pages/
│   ├── lib/
│   ├── store/
│   ├── utils/
│   └── types/
├── public/                    # Static assets
└── README.md
```

---

## Security Best Practices

1. **Never commit `.env` files** to the repository
2. **Use AWS Secrets Manager** for sensitive backend data
3. **Enable WAF** (Web Application Firewall) for Amplify app
4. **Set up CloudWatch alarms** for errors
5. **Use HTTPS only** (Amplify provides free SSL)
6. **Enable access logs** in Amplify settings

---

## Cost Estimation

AWS Amplify Pricing (as of 2026):
- **Build & Deploy:** $0.01 per build minute
- **Hosting:** $0.15 per GB served
- **Free Tier:** First 1,000 build minutes free per month
- **Estimated Cost:** $5-15/month for low to medium traffic

---

## Support

For issues or questions:
- AWS Amplify Docs: https://docs.aws.amazon.com/amplify/
- Amplify Discord: https://discord.gg/amplify
- AWS Support: https://console.aws.amazon.com/support/

---

**Deployment Checklist:**
- [ ] Created new repository
- [ ] Pushed code to new repository
- [ ] Set up AWS Amplify app
- [ ] Added all environment variables
- [ ] Verified successful deployment
- [ ] Updated backend FRONTEND_URL
- [ ] Tested authentication flow
- [ ] Tested download and subscription flow
- [ ] Configured custom domain (optional)
- [ ] Updated Stripe webhooks
- [ ] Switched to production keys (when ready)

---

**Created:** 2026-01-23  
**Branch:** Exametry_v1.0.0  
**Status:** Ready for Deployment
