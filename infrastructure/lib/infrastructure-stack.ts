import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayIntegrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as apigatewayAuthorizers from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as logs from 'aws-cdk-lib/aws-logs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

export class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const env = process.env.ENV || 'dev';

    // ============================================
    // DynamoDB Tables
    // ============================================

    // Users Table
    const usersTable = new dynamodb.Table(this, 'UsersTable', {
      tableName: `exametry-users-${env}`,
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: env === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: env === 'prod',
    });

    // GSI for email lookups
    usersTable.addGlobalSecondaryIndex({
      indexName: 'email-index',
      partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING },
    });

    // GSI for Stripe customer lookups
    usersTable.addGlobalSecondaryIndex({
      indexName: 'stripe-customer-index',
      partitionKey: { name: 'stripeCustomerId', type: dynamodb.AttributeType.STRING },
    });

    // Downloads Table
    const downloadsTable = new dynamodb.Table(this, 'DownloadsTable', {
      tableName: `exametry-downloads-${env}`,
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: env === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: env === 'prod',
    });

    // GSI for individual download lookups
    downloadsTable.addGlobalSecondaryIndex({
      indexName: 'downloadId-index',
      partitionKey: { name: 'downloadId', type: dynamodb.AttributeType.STRING },
    });

    // ============================================
    // S3 Buckets
    // ============================================

    // Avatars Bucket
    const avatarsBucket = new s3.Bucket(this, 'AvatarsBucket', {
      bucketName: `exametry-avatars-${env}-${this.account}`,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: env === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: env !== 'prod',
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT],
          allowedOrigins: ['*'], // TODO: Restrict to frontend domain
          allowedHeaders: ['*'],
        },
      ],
    });

    // Downloads Bucket
    const downloadsBucket = new s3.Bucket(this, 'DownloadsBucket', {
      bucketName: `exametry-downloads-${env}-${this.account}`,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: env === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: env !== 'prod',
      lifecycleRules: [
        {
          enabled: true,
          expiration: cdk.Duration.days(7),
        },
      ],
    });

    // ============================================
    // Secrets Manager
    // ============================================

    const stripeSecretKey = new secretsmanager.Secret(this, 'StripeSecretKey', {
      secretName: `exametry/stripe-secret-key-${env}`,
      description: 'Stripe API Secret Key',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ key: 'REPLACE_ME' }),
        generateStringKey: 'placeholder',
      },
    });

    const stripeWebhookSecret = new secretsmanager.Secret(this, 'StripeWebhookSecret', {
      secretName: `exametry/stripe-webhook-secret-${env}`,
      description: 'Stripe Webhook Signing Secret',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ key: 'REPLACE_ME' }),
        generateStringKey: 'placeholder',
      },
    });

    // ============================================
    // Cognito User Pool
    // ============================================

    const userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: `exametry-users-${env}`,
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
      },
      customAttributes: {
        fullName: new cognito.StringAttribute({ mutable: true }),
        avatarEmoji: new cognito.StringAttribute({ mutable: true }),
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: env === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // Admin User Group
    const adminGroup = new cognito.CfnUserPoolGroup(this, 'AdminGroup', {
      userPoolId: userPool.userPoolId,
      groupName: 'Admins',
      description: 'Administrator group with dashboard access',
    });

    // User Pool Client
    const userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool,
      userPoolClientName: `exametry-client-${env}`,
      authFlows: {
        userPassword: true,
        userSrp: true,
        custom: true,
      },
      generateSecret: false,
      preventUserExistenceErrors: true,
    });

    // ============================================
    // Lambda Functions
    // ============================================

    // Shared Lambda environment variables
    const lambdaEnvironment = {
      USERS_TABLE: usersTable.tableName,
      DOWNLOADS_TABLE: downloadsTable.tableName,
      DOWNLOADS_BUCKET: downloadsBucket.bucketName,
      STRIPE_SECRET_KEY_ARN: stripeSecretKey.secretArn,
      STRIPE_WEBHOOK_SECRET_ARN: stripeWebhookSecret.secretArn,
      ENV: env,
    };

    // Post Confirmation Lambda
    const postConfirmationLambda = new NodejsFunction(this, 'PostConfirmationLambda', {
      functionName: `exametry-auth-post-confirmation-${env}`,
      entry: 'lambda/auth-post-confirmation.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(30),
      environment: lambdaEnvironment,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    usersTable.grantWriteData(postConfirmationLambda);
    stripeSecretKey.grantRead(postConfirmationLambda);

    // Add Cognito trigger
    userPool.addTrigger(cognito.UserPoolOperation.POST_CONFIRMATION, postConfirmationLambda);

    // Download Check Lambda
    const downloadCheckLambda = new NodejsFunction(this, 'DownloadCheckLambda', {
      functionName: `exametry-download-check-${env}`,
      entry: 'lambda/download-check.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(10),
      environment: lambdaEnvironment,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    usersTable.grantReadData(downloadCheckLambda);

    // Download Handler Lambda
    const downloadHandlerLambda = new NodejsFunction(this, 'DownloadHandlerLambda', {
      functionName: `exametry-download-handler-${env}`,
      entry: 'lambda/download-handler.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(30),
      environment: lambdaEnvironment,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    usersTable.grantReadWriteData(downloadHandlerLambda);
    downloadsTable.grantWriteData(downloadHandlerLambda);
    downloadsBucket.grantPut(downloadHandlerLambda);
    downloadsBucket.grantRead(downloadHandlerLambda);

    // Download Track Lambda (for client-side downloads)
    const downloadTrackLambda = new NodejsFunction(this, 'DownloadTrackLambda', {
      functionName: `exametry-download-track-${env}`,
      entry: 'lambda/download-track.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(10),
      environment: lambdaEnvironment,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    usersTable.grantReadWriteData(downloadTrackLambda);
    downloadsTable.grantWriteData(downloadTrackLambda);

    // Stripe Webhook Lambda
    const stripeWebhookLambda = new NodejsFunction(this, 'StripeWebhookLambda', {
      functionName: `exametry-stripe-webhook-${env}`,
      entry: 'lambda/stripe-webhook.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(30),
      environment: lambdaEnvironment,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    usersTable.grantReadWriteData(stripeWebhookLambda);
    stripeSecretKey.grantRead(stripeWebhookLambda);
    stripeWebhookSecret.grantRead(stripeWebhookLambda);

    // Subscription Portal Lambda
    const subscriptionPortalLambda = new NodejsFunction(this, 'SubscriptionPortalLambda', {
      functionName: `exametry-subscription-portal-${env}`,
      entry: 'lambda/subscription-portal.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(10),
      environment: lambdaEnvironment,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    usersTable.grantReadData(subscriptionPortalLambda);
    stripeSecretKey.grantRead(subscriptionPortalLambda);

    // Subscription Checkout Lambda
    const subscriptionCheckoutLambda = new NodejsFunction(this, 'SubscriptionCheckoutLambda', {
      functionName: `exametry-subscription-checkout-${env}`,
      entry: 'lambda/subscription-checkout.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(10),
      environment: lambdaEnvironment,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    usersTable.grantReadData(subscriptionCheckoutLambda);
    stripeSecretKey.grantRead(subscriptionCheckoutLambda);

    // Admin Metrics Lambda
    const adminMetricsLambda = new NodejsFunction(this, 'AdminMetricsLambda', {
      functionName: `exametry-admin-metrics-${env}`,
      entry: 'lambda/admin-metrics.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(30),
      environment: lambdaEnvironment,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    usersTable.grantReadData(adminMetricsLambda);
    downloadsTable.grantReadData(adminMetricsLambda);
    stripeSecretKey.grantRead(adminMetricsLambda);

    // User Profile Lambda
    const userProfileLambda = new NodejsFunction(this, 'UserProfileLambda', {
      functionName: `exametry-user-profile-${env}`,
      entry: 'lambda/user-profile.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(10),
      environment: lambdaEnvironment,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    usersTable.grantReadWriteData(userProfileLambda);

    // ============================================
    // API Gateway
    // ============================================

    const httpApi = new apigateway.HttpApi(this, 'HttpApi', {
      apiName: `exametry-api-${env}`,
      description: 'Exametry Backend API',
      corsPreflight: {
        allowOrigins: ['*'], // TODO: Restrict to frontend domain after deployment
        allowMethods: [apigateway.CorsHttpMethod.ANY],
        allowHeaders: ['*'],
        allowCredentials: false,
      },
    });

    // JWT Authorizer
    const authorizer = new apigatewayAuthorizers.HttpJwtAuthorizer('JwtAuthorizer',
      `https://cognito-idp.${this.region}.amazonaws.com/${userPool.userPoolId}`, {
      jwtAudience: [userPoolClient.userPoolClientId],
    });

    // Download routes
    httpApi.addRoutes({
      path: '/downloads/check',
      methods: [apigateway.HttpMethod.GET],
      integration: new apigatewayIntegrations.HttpLambdaIntegration('DownloadCheckIntegration', downloadCheckLambda),
      authorizer,
    });

    httpApi.addRoutes({
      path: '/downloads',
      methods: [apigateway.HttpMethod.POST],
      integration: new apigatewayIntegrations.HttpLambdaIntegration('DownloadHandlerIntegration', downloadHandlerLambda),
      authorizer,
    });

    httpApi.addRoutes({
      path: '/downloads/track',
      methods: [apigateway.HttpMethod.POST],
      integration: new apigatewayIntegrations.HttpLambdaIntegration('DownloadTrackIntegration', downloadTrackLambda),
      authorizer,
    });

    // Subscription routes
    httpApi.addRoutes({
      path: '/subscription/portal',
      methods: [apigateway.HttpMethod.GET],
      integration: new apigatewayIntegrations.HttpLambdaIntegration('SubscriptionPortalIntegration', subscriptionPortalLambda),
      authorizer,
    });

    httpApi.addRoutes({
      path: '/subscription/checkout',
      methods: [apigateway.HttpMethod.POST],
      integration: new apigatewayIntegrations.HttpLambdaIntegration('SubscriptionCheckoutIntegration', subscriptionCheckoutLambda),
      authorizer,
    });

    // User profile routes
    httpApi.addRoutes({
      path: '/user/profile',
      methods: [apigateway.HttpMethod.GET, apigateway.HttpMethod.PUT],
      integration: new apigatewayIntegrations.HttpLambdaIntegration('UserProfileIntegration', userProfileLambda),
      authorizer,
    });

    // Admin routes
    httpApi.addRoutes({
      path: '/admin/metrics',
      methods: [apigateway.HttpMethod.GET],
      integration: new apigatewayIntegrations.HttpLambdaIntegration('AdminMetricsIntegration', adminMetricsLambda),
      authorizer,
    });

    // Stripe webhook (no auth)
    httpApi.addRoutes({
      path: '/webhooks/stripe',
      methods: [apigateway.HttpMethod.POST],
      integration: new apigatewayIntegrations.HttpLambdaIntegration('StripeWebhookIntegration', stripeWebhookLambda),
    });

    // ============================================
    // Outputs
    // ============================================

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID',
      exportName: `exametry-user-pool-id-${env}`,
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
      exportName: `exametry-user-pool-client-id-${env}`,
    });

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: httpApi.url || '',
      description: 'API Gateway URL',
      exportName: `exametry-api-url-${env}`,
    });

    new cdk.CfnOutput(this, 'UsersTableName', {
      value: usersTable.tableName,
      description: 'DynamoDB Users Table Name',
    });

    new cdk.CfnOutput(this, 'DownloadsTableName', {
      value: downloadsTable.tableName,
      description: 'DynamoDB Downloads Table Name',
    });

    new cdk.CfnOutput(this, 'DownloadsBucketName', {
      value: downloadsBucket.bucketName,
      description: 'S3 Downloads Bucket Name',
    });

    new cdk.CfnOutput(this, 'AvatarsBucketName', {
      value: avatarsBucket.bucketName,
      description: 'S3 Avatars Bucket Name',
    });

    new cdk.CfnOutput(this, 'StripeSecretKeyArn', {
      value: stripeSecretKey.secretArn,
      description: 'Stripe Secret Key ARN (update this secret with real key)',
    });

    new cdk.CfnOutput(this, 'StripeWebhookSecretArn', {
      value: stripeWebhookSecret.secretArn,
      description: 'Stripe Webhook Secret ARN (update this secret with real key)',
    });
  }
}
