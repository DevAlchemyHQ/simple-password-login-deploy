import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { UpdateCommand, QueryCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import Stripe from 'stripe';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const secretsClient = new SecretsManagerClient({});

let stripeClient: Stripe | null = null;
let webhookSecret: string | null = null;

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

async function getWebhookSecret(): Promise<string> {
  if (webhookSecret) return webhookSecret;

  const secretArn = process.env.STRIPE_WEBHOOK_SECRET_ARN!;
  const response = await secretsClient.send(
    new GetSecretValueCommand({ SecretId: secretArn })
  );

  const secretString = response.SecretString;
  if (!secretString) {
    throw new Error('Webhook secret not found');
  }

  const secret = JSON.parse(secretString);
  webhookSecret = secret.key;
  return webhookSecret;
}

async function getUserIdByStripeCustomer(customerId: string): Promise<string | null> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: process.env.USERS_TABLE!,
      IndexName: 'stripe-customer-index',
      KeyConditionExpression: 'stripeCustomerId = :customerId',
      ExpressionAttributeValues: {
        ':customerId': customerId,
      },
      Limit: 1,
    })
  );

  return result.Items?.[0]?.userId || null;
}

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  console.log('Stripe webhook event received');

  try {
    const stripe = await getStripeClient();
    const secret = await getWebhookSecret();

    // Verify webhook signature
    const signature = event.headers['stripe-signature'];
    if (!signature) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing stripe-signature header' }),
      };
    }

    let stripeEvent: Stripe.Event;
    try {
      stripeEvent = stripe.webhooks.constructEvent(event.body!, signature, secret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid signature' }),
      };
    }

    console.log('Webhook event type:', stripeEvent.type);

    const now = Date.now();

    // Handle different event types
    switch (stripeEvent.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = stripeEvent.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const userId = await getUserIdByStripeCustomer(customerId);

        if (!userId) {
          console.error('User not found for Stripe customer:', customerId);
          return { statusCode: 404, body: JSON.stringify({ error: 'User not found' }) };
        }

        const status = subscription.status === 'active' ? 'active' : subscription.status;
        const cancelsAt = subscription.cancel_at ? subscription.cancel_at * 1000 : null;

        await docClient.send(
          new UpdateCommand({
            TableName: process.env.USERS_TABLE!,
            Key: { userId },
            UpdateExpression:
              'SET subscriptionStatus = :status, subscriptionId = :subId, cancelsAt = :cancelsAt, updatedAt = :now',
            ExpressionAttributeValues: {
              ':status': status,
              ':subId': subscription.id,
              ':cancelsAt': cancelsAt,
              ':now': now,
            },
          })
        );

        console.log('Updated subscription for user:', userId, 'Status:', status);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = stripeEvent.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const userId = await getUserIdByStripeCustomer(customerId);

        if (!userId) {
          console.error('User not found for Stripe customer:', customerId);
          return { statusCode: 404, body: JSON.stringify({ error: 'User not found' }) };
        }

        // Reset to free tier
        await docClient.send(
          new UpdateCommand({
            TableName: process.env.USERS_TABLE!,
            Key: { userId },
            UpdateExpression:
              'SET subscriptionStatus = :status, subscriptionId = :null, downloadCount = :zero, cancelsAt = :null, updatedAt = :now',
            ExpressionAttributeValues: {
              ':status': 'free',
              ':null': null,
              ':zero': 0,
              ':now': now,
            },
          })
        );

        console.log('Subscription deleted, reset user to free tier:', userId);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = stripeEvent.data.object as Stripe.Invoice;
        console.log('Payment succeeded for customer:', invoice.customer);
        // Payment successful - subscription already updated via subscription.updated event
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = stripeEvent.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const userId = await getUserIdByStripeCustomer(customerId);

        console.error('Payment failed for user:', userId, 'Customer:', customerId);
        // TODO: Send email notification, flag for admin review
        break;
      }

      default:
        console.log('Unhandled event type:', stripeEvent.type);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true }),
    };
  } catch (error) {
    console.error('Error processing webhook:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
