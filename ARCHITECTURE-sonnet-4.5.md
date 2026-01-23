# Exametry v1.0.0 - AWS Migration Architecture

**Date:** 2026-01-23
**Model:** Claude Sonnet 4.5
**Branch:** Exametry_v1.0.0

## Project Overview

Migration from Supabase to full AWS backend with Stripe subscription integration for a React/TypeScript image metadata conversion application.

## Business Requirements

### Authentication
- AWS Cognito with email OTP (no password initially, OTP for verification)
- Custom React UI (not AWS Hosted UI)
- Admin user group for dashboard access

### Subscription Model
- **Free Tier**: 3 downloads per user (no payment method required)
- **Pro Plan**: £9.99/month for unlimited downloads
- Payment collected AFTER user exhausts free downloads
- User can manage subscription via Stripe Customer Portal
- Cancellation takes effect at end of billing period
- After cancellation: User downgrades to free tier (download count resets to 0)

### Download Definition
1. User uploads PDF to app
2. App processes/converts image titles (metadata manipulation)
3. User downloads the processed/modified file ← **THIS counts toward quota**

### Regional Requirements
- **AWS Region**: eu-west-2 (London) - UK resident, GDPR compliance
- **Stripe**: GBP currency

## Technology Stack

### Frontend
- React + TypeScript + Vite
- Hosted on AWS Amplify
- Branch: `Exametry_v1.0.0` (testing environment)
- Main branch: `main` (production - unchanged for now)

### Backend - AWS Services
- **Cognito**: User authentication with email OTP
- **DynamoDB**: User data, download tracking, subscription metadata
- **Lambda**: Business logic (Node.js/TypeScript)
- **API Gateway**: HTTP API for REST endpoints
- **S3**: File storage (avatars, processed downloads)
- **Secrets Manager**: Stripe API keys
- **CloudWatch**: Logging and monitoring

### Infrastructure as Code
- **AWS CDK** (TypeScript)
- Reason: Same language as frontend, type safety, AWS native

### Payment Processing
- **Stripe**: Subscription management
- **Stripe Checkout**: Payment collection (hosted by Stripe)
- **Stripe Customer Portal**: Self-service subscription management

## Architecture Components

### 1. DynamoDB Tables

#### Users Table
```
Table Name: exametry-users-{env}
Primary Key: userId (String) - Cognito sub

Attributes:
- userId: string (PK) - Cognito user sub
- email: string
- fullName: string
- avatarEmoji: string
- stripeCustomerId: string
- subscriptionStatus: string (free | active | canceling | canceled)
- subscriptionId: string (Stripe subscription ID)
- downloadCount: number (for free tier tracking)
- cancelsAt: number (timestamp when subscription ends)
- createdAt: number (timestamp)
- updatedAt: number (timestamp)

GSI: email-index (for lookups by email)
GSI: stripe-customer-index (for webhook processing)
```

#### Downloads Table
```
Table Name: exametry-downloads-{env}
Primary Key: userId (String)
Sort Key: timestamp (Number)

Attributes:
- userId: string (PK)
- timestamp: number (SK) - Unix timestamp
- downloadId: string (unique ID)
- fileName: string
- fileSize: number
- s3Key: string
- wasFreeTier: boolean
- createdAt: number

GSI: downloadId-index (for individual download lookups)
```

### 2. Cognito User Pool

```
User Pool Name: exametry-users-{env}
Region: eu-west-2

Configuration:
- Sign-in: Email only
- MFA: Optional (Email OTP)
- Password policy: Strong (not used for OTP flow but available)
- Email verification: Required
- Custom attributes:
  - custom:fullName
  - custom:avatarEmoji

User Groups:
- Admins (for dashboard access)

Triggers:
- Post Confirmation: Lambda to create DynamoDB user record
```

### 3. Lambda Functions

#### auth-post-confirmation
```
Trigger: Cognito Post Confirmation
Purpose: Create user record in DynamoDB and Stripe
Input: Cognito event
Output: Success/failure

Logic:
1. Extract user data from Cognito event
2. Create Stripe customer (no payment method)
3. Create DynamoDB user record with:
   - subscriptionStatus: 'free'
   - downloadCount: 0
4. Return success
```

#### download-check
```
Trigger: API Gateway GET /downloads/check
Purpose: Validate if user can download
Input: userId (from JWT)
Output: { canDownload: boolean, remaining: number, needsSubscription: boolean }

Logic:
1. Get user from DynamoDB
2. If subscriptionStatus === 'active': return canDownload: true
3. If subscriptionStatus === 'free':
   - If downloadCount < 3: return canDownload: true, remaining: 3 - downloadCount
   - If downloadCount >= 3: return needsSubscription: true
4. Return result
```

#### download-handler
```
Trigger: API Gateway POST /downloads
Purpose: Generate presigned URL and track download
Input: { userId, fileName, fileData }
Output: { downloadUrl: string, downloadId: string }

Logic:
1. Check download quota (call download-check logic)
2. If cannot download: return error
3. Upload file to S3 downloads bucket
4. Generate presigned URL (15 min expiry)
5. Create download record in DynamoDB
6. Increment downloadCount if free tier
7. Return presigned URL
```

#### stripe-webhook
```
Trigger: API Gateway POST /webhooks/stripe
Purpose: Handle Stripe subscription events
Input: Stripe webhook event
Output: 200 OK

Events to handle:
- customer.subscription.created
- customer.subscription.updated
- customer.subscription.deleted
- invoice.payment_succeeded
- invoice.payment_failed

Logic:
1. Verify webhook signature
2. Parse event type
3. Update DynamoDB user record:
   - subscription.created: subscriptionStatus = 'active'
   - subscription.updated: update status, cancelsAt
   - subscription.deleted: subscriptionStatus = 'free', reset downloadCount
   - payment_failed: flag for admin review
4. Return 200 OK
```

#### subscription-portal
```
Trigger: API Gateway GET /subscription/portal
Purpose: Generate Stripe Customer Portal URL
Input: userId (from JWT)
Output: { url: string }

Logic:
1. Get user from DynamoDB
2. Get stripeCustomerId
3. Create Stripe billing portal session
4. Return portal URL
```

#### admin-metrics
```
Trigger: API Gateway GET /admin/metrics
Purpose: Aggregate dashboard metrics
Input: Admin JWT
Output: Dashboard data

Logic:
1. Verify admin group membership
2. Query DynamoDB for:
   - Total users by status
   - Downloads in time period
   - Conversion rate
3. Query Stripe for:
   - MRR
   - Recent subscriptions
   - Failed payments
4. Return aggregated data
```

### 4. API Gateway Routes

```
Base URL: https://api.exametry.{domain}

Authentication: JWT from Cognito (Lambda authorizer)

Routes:
GET    /downloads/check           - Check download quota
POST   /downloads                 - Create download
GET    /subscription/portal       - Get Stripe portal URL
POST   /subscription/checkout     - Create Stripe checkout session
POST   /webhooks/stripe           - Stripe webhooks (no auth)
GET    /admin/metrics             - Dashboard metrics (admin only)
GET    /admin/users               - List users (admin only)
```

### 5. S3 Buckets

```
exametry-avatars-{env}
- Public read (with CloudFront)
- User avatar images
- Lifecycle: None

exametry-downloads-{env}
- Private
- Presigned URLs only
- Processed files for download
- Lifecycle: Delete after 7 days

exametry-frontend-{env} (optional if not using Amplify)
- Public read via CloudFront
- React app hosting
```

### 6. Stripe Configuration

```
Products:
1. Pro Plan
   - Name: "Exametry Pro"
   - Description: "Unlimited downloads"
   - Price: £9.99/month
   - Recurring: Monthly
   - Currency: GBP

Checkout Configuration:
- Mode: subscription
- Success URL: {frontend}/subscription/success
- Cancel URL: {frontend}/subscription/cancel
- Allow promotion codes: Yes

Customer Portal:
- Enable: Subscription cancellation, payment method updates, billing history
- Business information: Set company name, support email
```

### 7. Frontend Changes

#### Remove Supabase
```
Files to delete/modify:
- src/lib/supabase.ts (delete)
- Remove @supabase/supabase-js from package.json
- Update all auth components
- Remove all supabase imports
```

#### Add AWS SDK
```
Dependencies to add:
- @aws-sdk/client-cognito-identity-provider
- @aws-amplify/auth (or aws-amplify)
- @stripe/stripe-js
- @stripe/react-stripe-js (if using Elements)

Environment variables:
- VITE_AWS_REGION=eu-west-2
- VITE_COGNITO_USER_POOL_ID={generated}
- VITE_COGNITO_CLIENT_ID={generated}
- VITE_API_GATEWAY_URL={generated}
- VITE_STRIPE_PUBLIC_KEY={from Stripe dashboard}
```

#### New Components/Pages
```
src/components/subscription/
- SubscriptionBadge.tsx - Show current plan
- UpgradePrompt.tsx - CTA when hitting limit
- StripeCheckout.tsx - Initiate checkout flow
- SubscriptionManage.tsx - Link to portal

src/pages/admin/
- AdminDashboard.tsx - Main admin page
- UsersList.tsx - List all users
- MetricsView.tsx - Analytics display
```

#### Auth Flow Updates
```
Login:
1. User enters email
2. Cognito sends OTP to email
3. User enters OTP
4. Cognito returns JWT tokens
5. Store in localStorage/sessionStorage
6. Redirect to app

Signup:
1. User enters email + full name
2. Cognito creates user
3. Cognito sends verification OTP
4. User enters OTP
5. Post-confirmation trigger creates DynamoDB + Stripe records
6. Return JWT tokens
7. Redirect to app
```

#### Download Flow Updates
```
Before Download:
1. Call GET /downloads/check
2. If needsSubscription: Show UpgradePrompt
3. If canDownload: Proceed

Download:
1. Call POST /downloads with file data
2. Receive presigned URL
3. Trigger browser download
4. Update UI (remaining downloads if free tier)

After 3rd Download:
1. Show modal: "You've used all free downloads!"
2. CTA: "Subscribe for £9.99/month"
3. Click -> Call POST /subscription/checkout
4. Redirect to Stripe Checkout
5. After payment -> Webhook updates DB
6. User redirected to success page
```

## Security Considerations

1. **JWT Validation**: All API calls validate Cognito JWT
2. **Webhook Signatures**: Stripe webhooks verified with signature
3. **Presigned URLs**: S3 URLs expire in 15 minutes
4. **Admin Routes**: Check Cognito group membership
5. **Secrets**: Store Stripe keys in AWS Secrets Manager
6. **CORS**: API Gateway configured for frontend domain only
7. **Rate Limiting**: API Gateway throttling enabled

## Deployment Strategy

### Phase 1: Infrastructure (CDK)
1. Deploy DynamoDB tables
2. Deploy Cognito User Pool
3. Deploy S3 buckets
4. Deploy Lambda functions
5. Deploy API Gateway
6. Configure Secrets Manager

### Phase 2: Frontend Migration
1. Remove Supabase dependencies
2. Implement Cognito auth
3. Update API calls to API Gateway
4. Add subscription UI components
5. Add admin dashboard

### Phase 3: Stripe Setup
1. Create product in Stripe dashboard
2. Configure webhooks
3. Test checkout flow
4. Test portal flow
5. Test webhook handling

### Phase 4: Testing
1. Test signup/login flow
2. Test 3 free downloads
3. Test subscription flow
4. Test cancellation flow
5. Test admin dashboard
6. Load testing

### Phase 5: Amplify
1. Push branch to GitHub
2. Connect branch to Amplify
3. Configure build settings
4. Deploy to test URL
5. Verify full flow on Amplify URL

## Monitoring & Alerts

### CloudWatch Metrics
- Lambda errors and duration
- API Gateway 4xx/5xx errors
- DynamoDB throttling

### CloudWatch Alarms
- Failed webhook processing
- Failed payment events
- High error rates

### Logging
- All Lambda functions log to CloudWatch
- Structured JSON logging
- Request IDs for tracing

## Cost Estimates (Monthly)

```
DynamoDB: ~$5 (low traffic)
Lambda: ~$5 (free tier eligible)
API Gateway: ~$3.50 per million requests
S3: ~$1 (with lifecycle policies)
Cognito: Free for < 50k MAU
CloudWatch: ~$5 (logs + metrics)

Total AWS: ~$20-30/month (low traffic)
Stripe: 1.5% + 20p per transaction
Amplify: Included in current setup
```

## Migration Checklist

- [x] Create new branch: Exametry_v1.0.0
- [x] Initialize CDK project
- [ ] Build CDK infrastructure stack
- [ ] Deploy AWS infrastructure
- [ ] Configure Stripe product
- [ ] Remove Supabase code
- [ ] Implement Cognito auth in React
- [ ] Add download quota checking
- [ ] Integrate Stripe Checkout
- [ ] Add Stripe Customer Portal
- [ ] Build admin dashboard
- [ ] Update package.json to v1.0.0
- [ ] Push branch and configure Amplify
- [ ] Test complete user journey
- [ ] Review and merge to main

## Key Decisions Summary

1. **CDK over Terraform**: TypeScript consistency, AWS native
2. **Custom UI over Hosted UI**: Better UX, full control
3. **Track free downloads in DynamoDB**: Faster than Stripe API calls
4. **Stripe for paid subscriptions only**: Simpler accounting
5. **End-of-period cancellation**: Better user experience
6. **Admin in same app**: Simpler maintenance
7. **15-min presigned URLs**: Security vs usability balance
8. **7-day download retention**: Balance storage costs and user access

## Future Enhancements (Not in v1.0.0)

- Annual subscription discount
- Team/organization accounts
- Download history view for users
- Email notifications for subscription events
- Advanced analytics in admin dashboard
- A/B testing for pricing
- Referral program
- API rate limiting per user

---

**Next Steps:**
1. Complete CDK stack implementation
2. Deploy to AWS
3. Begin frontend migration
