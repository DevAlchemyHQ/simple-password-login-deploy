import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { GetCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
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

interface User {
  userId: string;
  stripeCustomerId: string;
}

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  console.log('Subscription portal event:', JSON.stringify(event, null, 2));

  try {
    // Extract user ID from JWT claims
    const userId = event.requestContext.authorizer?.jwt.claims.sub as string;

    if (!userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    // Get user from DynamoDB
    const result = await docClient.send(
      new GetCommand({
        TableName: process.env.USERS_TABLE!,
        Key: { userId },
      })
    );

    const user = result.Item as User | undefined;

    if (!user) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'User not found' }),
      };
    }

    if (!user.stripeCustomerId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No Stripe customer found' }),
      };
    }

    // Create Stripe billing portal session
    const stripe = await getStripeClient();
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: process.env.FRONTEND_URL || 'http://localhost:5173/profile',
    });

    console.log('Created billing portal session for user:', userId);

    return {
      statusCode: 200,
      body: JSON.stringify({
        url: session.url,
      }),
    };
  } catch (error) {
    console.error('Error creating portal session:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
