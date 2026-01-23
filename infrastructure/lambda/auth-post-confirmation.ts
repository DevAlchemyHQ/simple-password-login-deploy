import { PostConfirmationTriggerHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { PutCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
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

export const handler: PostConfirmationTriggerHandler = async (event) => {
  console.log('Post confirmation event:', JSON.stringify(event, null, 2));

  const { userPoolId, userName, request } = event;
  const email = request.userAttributes.email;
  const fullName = request.userAttributes['custom:fullName'] || '';
  const avatarEmoji = request.userAttributes['custom:avatarEmoji'] || '👤';

  try {
    // Create Stripe customer
    const stripe = await getStripeClient();
    const stripeCustomer = await stripe.customers.create({
      email,
      name: fullName,
      metadata: {
        cognitoUserId: userName,
        source: 'exametry',
      },
    });

    console.log('Created Stripe customer:', stripeCustomer.id);

    // Create DynamoDB user record
    const now = Date.now();
    await docClient.send(
      new PutCommand({
        TableName: process.env.USERS_TABLE!,
        Item: {
          userId: userName,
          email,
          fullName,
          avatarEmoji,
          stripeCustomerId: stripeCustomer.id,
          subscriptionStatus: 'free',
          subscriptionId: null,
          downloadCount: 0,
          cancelsAt: null,
          createdAt: now,
          updatedAt: now,
        },
      })
    );

    console.log('Created DynamoDB user record for:', userName);

    return event;
  } catch (error) {
    console.error('Error in post confirmation:', error);
    throw error;
  }
};
