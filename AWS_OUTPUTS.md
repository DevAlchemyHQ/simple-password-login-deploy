# AWS Infrastructure Deployment Outputs

**Deployed:** 2026-01-23  
**Environment:** dev  
**Region:** eu-west-2 (London)  
**Branch:** Exametry_v1.0.0

## ✅ Deployed Resources

### API Gateway
**API URL:** https://3hbkcdkri1.execute-api.eu-west-2.amazonaws.com/

### Cognito
**User Pool ID:** eu-west-2_Jl6I12sA6  
**User Pool Client ID:** 1bphman689t3aiurmt4bkup7am

### DynamoDB Tables
**Users Table:** exametry-users-dev  
**Downloads Table:** exametry-downloads-dev

### S3 Buckets
**Avatars Bucket:** exametry-avatars-dev-913524945607  
**Downloads Bucket:** exametry-downloads-dev-913524945607

### Secrets Manager
**Stripe Secret Key ARN:** arn:aws:secretsmanager:eu-west-2:913524945607:secret:exametry/stripe-secret-key-dev-mXiIvo  
**Stripe Webhook Secret ARN:** arn:aws:secretsmanager:eu-west-2:913524945607:secret:exametry/stripe-webhook-secret-dev-rw92rF

---

## 🔧 Next Steps

### 1. Configure Stripe

#### A. Create Product & Price
1. Log into Stripe Dashboard: https://dashboard.stripe.com/test/products
2. Click "Add product"
3. Name: "Exametry Pro"
4. Description: "Unlimited downloads for image metadata conversion"
5. Pricing: One-time or recurring
6. Price: £9.99 GBP
7. Billing period: Monthly
8. Click "Add product"
9. **Copy the Price ID** (starts with `price_`)

#### B. Update Stripe Secrets in AWS
```bash
# Replace with your actual Stripe keys
aws secretsmanager put-secret-value \
  --region eu-west-2 \
  --secret-id arn:aws:secretsmanager:eu-west-2:913524945607:secret:exametry/stripe-secret-key-dev-mXiIvo \
  --secret-string '{"key":"sk_test_YOUR_STRIPE_SECRET_KEY"}'

# This will be updated after webhook setup
aws secretsmanager put-secret-value \
  --region eu-west-2 \
  --secret-id arn:aws:secretsmanager:eu-west-2:913524945607:secret:exametry/stripe-webhook-secret-dev-rw92rF \
  --secret-string '{"key":"whsec_YOUR_WEBHOOK_SECRET"}'
```

#### C. Update Lambda Environment Variable
```bash
# Add STRIPE_PRICE_ID to all subscription Lambdas
aws lambda update-function-configuration \
  --region eu-west-2 \
  --function-name exametry-subscription-checkout-dev \
  --environment "Variables={USERS_TABLE=exametry-users-dev,DOWNLOADS_TABLE=exametry-downloads-dev,DOWNLOADS_BUCKET=exametry-downloads-dev-913524945607,STRIPE_SECRET_KEY_ARN=arn:aws:secretsmanager:eu-west-2:913524945607:secret:exametry/stripe-secret-key-dev-mXiIvo,STRIPE_WEBHOOK_SECRET_ARN=arn:aws:secretsmanager:eu-west-2:913524945607:secret:exametry/stripe-webhook-secret-dev-rw92rF,ENV=dev,STRIPE_PRICE_ID=price_YOUR_PRICE_ID}"
```

#### D. Configure Stripe Webhook
1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://3hbkcdkri1.execute-api.eu-west-2.amazonaws.com/webhooks/stripe`
4. Description: "Exametry subscription events"
5. Events to send:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
6. Click "Add endpoint"
7. **Copy the Signing secret** (whsec_...)
8. Update the webhook secret in Secrets Manager (see command above)

### 2. Configure Frontend (.env)

Create/update `.env` file in your React app:

```bash
# AWS Configuration
VITE_AWS_REGION=eu-west-2
VITE_COGNITO_USER_POOL_ID=eu-west-2_Jl6I12sA6
VITE_COGNITO_CLIENT_ID=1bphman689t3aiurmt4bkup7am
VITE_API_GATEWAY_URL=https://3hbkcdkri1.execute-api.eu-west-2.amazonaws.com

# Stripe Configuration
VITE_STRIPE_PUBLIC_KEY=pk_test_YOUR_STRIPE_PUBLISHABLE_KEY

# Optional: Frontend URL for redirects
VITE_FRONTEND_URL=http://localhost:5173
```

### 3. Create Admin User

```bash
# Create admin user via AWS CLI
aws cognito-idp admin-create-user \
  --region eu-west-2 \
  --user-pool-id eu-west-2_Jl6I12sA6 \
  --username admin@exametry.com \
  --user-attributes Name=email,Value=admin@exametry.com Name=email_verified,Value=true \
  --message-action SUPPRESS

# Add user to Admins group
aws cognito-idp admin-add-user-to-group \
  --region eu-west-2 \
  --user-pool-id eu-west-2_Jl6I12sA6 \
  --username admin@exametry.com \
  --group-name Admins
```

### 4. Test the Infrastructure

```bash
# Check DynamoDB tables
aws dynamodb list-tables --region eu-west-2 | grep exametry

# Check Lambda functions
aws lambda list-functions --region eu-west-2 | grep exametry

# Check S3 buckets
aws s3 ls | grep exametry

# Check API Gateway
curl https://3hbkcdkri1.execute-api.eu-west-2.amazonaws.com/
```

---

## 📝 API Endpoints

Base URL: `https://3hbkcdkri1.execute-api.eu-west-2.amazonaws.com`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/downloads/check` | JWT | Check download quota |
| POST | `/downloads` | JWT | Create download & get presigned URL |
| GET | `/subscription/portal` | JWT | Get Stripe Customer Portal URL |
| POST | `/subscription/checkout` | JWT | Create Stripe Checkout session |
| GET | `/admin/metrics` | JWT (Admin) | Get dashboard metrics |
| POST | `/webhooks/stripe` | Stripe Signature | Stripe webhook handler |

---

## 🔍 Monitoring

### CloudWatch Logs
- Log Group Pattern: `/aws/lambda/exametry-*`
- View logs: https://eu-west-2.console.aws.amazon.com/cloudwatch/home?region=eu-west-2#logsV2:log-groups

### DynamoDB
- Console: https://eu-west-2.console.aws.amazon.com/dynamodbv2/home?region=eu-west-2#tables

### Cognito
- User Pool: https://eu-west-2.console.aws.amazon.com/cognito/v2/idp/user-pools/eu-west-2_Jl6I12sA6/users

---

## 🚨 Troubleshooting

If something doesn't work:

1. **Check Lambda logs** in CloudWatch
2. **Verify Stripe secrets** are correctly set
3. **Check API Gateway** CORS settings
4. **Verify Cognito** user pool settings
5. **Test webhooks** in Stripe Dashboard

---

## 📚 Resources

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [Stripe API Documentation](https://stripe.com/docs/api)
- [AWS Cognito Documentation](https://docs.aws.amazon.com/cognito/)
- [Architecture Document](./ARCHITECTURE-sonnet-4.5.md)
