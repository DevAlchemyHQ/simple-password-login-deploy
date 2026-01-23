import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { ScanCommand, QueryCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import Stripe from 'stripe';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const secretsClient = new SecretsManagerClient({});

let stripeClient: Stripe | null = null;

async function getStripeClient(): Promise<Stripe> {
  if (stripeClient) return stripeClient;

  const secretArn = process.env.STRIPE_SECRET_KEY_ARN!;
  const response = await secretsClient.send(
    new GetSecretValueCommand({ SecretId: secretArn })
  );

  const secretString = response.SecretString;
  if (!secretString) {
    throw new Error('Stripe secret key not found');
  }

  const secret = JSON.parse(secretString);
  stripeClient = new Stripe(secret.key, { apiVersion: '2024-12-18.acacia' });
  return stripeClient;
}

// Check if user is admin from JWT claims
function isAdmin(event: any): boolean {
  const groups = event.requestContext.authorizer?.jwt.claims['cognito:groups'];
  return groups && Array.isArray(groups) && groups.includes('Admins');
}

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  console.log('Admin metrics event:', JSON.stringify(event, null, 2));

  try {
    // Check admin permissions
    if (!isAdmin(event)) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Forbidden: Admin access required' }),
      };
    }

    // Scan users table for metrics
    const usersResult = await docClient.send(
      new ScanCommand({
        TableName: process.env.USERS_TABLE!,
      })
    );

    const users = usersResult.Items || [];

    // Calculate user metrics
    const totalUsers = users.length;
    const freeUsers = users.filter((u) => u.subscriptionStatus === 'free').length;
    const activeSubscriptions = users.filter((u) => u.subscriptionStatus === 'active').length;
    const cancelingSubscriptions = users.filter((u) => u.subscriptionStatus === 'canceling').length;

    // Calculate conversion rate
    const conversionRate = totalUsers > 0 ? (activeSubscriptions / totalUsers) * 100 : 0;

    // Get download statistics
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    // Note: This is a simplified version. For production, use DynamoDB Streams
    // or aggregate data periodically to avoid expensive scans
    const downloadsResult = await docClient.send(
      new ScanCommand({
        TableName: process.env.DOWNLOADS_TABLE!,
        FilterExpression: '#ts > :thirtyDaysAgo',
        ExpressionAttributeNames: {
          '#ts': 'timestamp',
        },
        ExpressionAttributeValues: {
          ':thirtyDaysAgo': thirtyDaysAgo,
        },
      })
    );

    const recentDownloads = downloadsResult.Items || [];
    const totalDownloads = recentDownloads.length;
    const freeDownloads = recentDownloads.filter((d) => d.wasFreeTier).length;
    const paidDownloads = totalDownloads - freeDownloads;

    // Get Stripe metrics
    const stripe = await getStripeClient();

    // Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      status: 'active',
      limit: 100,
    });

    // Calculate MRR
    let mrr = 0;
    subscriptions.data.forEach((sub) => {
      sub.items.data.forEach((item) => {
        if (item.price.recurring?.interval === 'month') {
          mrr += (item.price.unit_amount || 0) * item.quantity;
        } else if (item.price.recurring?.interval === 'year') {
          mrr += ((item.price.unit_amount || 0) * item.quantity) / 12;
        }
      });
    });

    // Convert from pence to pounds
    const mrrGBP = mrr / 100;

    // Get recent failed payments
    const paymentIntents = await stripe.paymentIntents.list({
      limit: 10,
    });

    const failedPayments = paymentIntents.data.filter((pi) => pi.status === 'requires_payment_method');

    const metrics = {
      users: {
        total: totalUsers,
        free: freeUsers,
        active: activeSubscriptions,
        canceling: cancelingSubscriptions,
        conversionRate: conversionRate.toFixed(2) + '%',
      },
      downloads: {
        total: totalDownloads,
        free: freeDownloads,
        paid: paidDownloads,
        period: 'Last 30 days',
      },
      revenue: {
        mrr: mrrGBP,
        currency: 'GBP',
        activeSubscriptions: subscriptions.data.length,
      },
      alerts: {
        failedPayments: failedPayments.length,
      },
      timestamp: now,
    };

    console.log('Admin metrics calculated successfully');

    return {
      statusCode: 200,
      body: JSON.stringify(metrics),
    };
  } catch (error) {
    console.error('Error calculating admin metrics:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
