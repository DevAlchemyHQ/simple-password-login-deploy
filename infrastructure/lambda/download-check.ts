import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { GetCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

interface User {
  userId: string;
  subscriptionStatus: string;
  downloadCount: number;
}

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  console.log('Download check event:', JSON.stringify(event, null, 2));

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

    // Check subscription status
    if (user.subscriptionStatus === 'active') {
      return {
        statusCode: 200,
        body: JSON.stringify({
          canDownload: true,
          remaining: -1, // Unlimited
          needsSubscription: false,
          subscriptionStatus: 'active',
        }),
      };
    }

    // Check free tier quota
    if (user.downloadCount < 3) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          canDownload: true,
          remaining: 3 - user.downloadCount,
          needsSubscription: false,
          subscriptionStatus: 'free',
        }),
      };
    }

    // Quota exceeded
    return {
      statusCode: 200,
      body: JSON.stringify({
        canDownload: false,
        remaining: 0,
        needsSubscription: true,
        subscriptionStatus: 'free',
      }),
    };
  } catch (error) {
    console.error('Error checking download quota:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
