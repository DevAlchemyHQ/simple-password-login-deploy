import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { GetCommand, PutCommand, UpdateCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

interface User {
  userId: string;
  subscriptionStatus: string;
  downloadCount: number;
}

/**
 * Lightweight endpoint to track client-side downloads
 * Only increments counter and creates download record without file upload
 */
export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  console.log('Download track event:', JSON.stringify(event, null, 2));

  try {
    // Extract user ID from JWT claims
    const userId = event.requestContext.authorizer?.jwt.claims.sub as string;

    if (!userId) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { fileName, fileSize } = body;

    if (!fileName) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing fileName' }),
      };
    }

    // Get user from DynamoDB
    const userResult = await docClient.send(
      new GetCommand({
        TableName: process.env.USERS_TABLE!,
        Key: { userId },
      })
    );

    const user = userResult.Item as User | undefined;

    if (!user) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'User not found' }),
      };
    }

    // Check quota (redundant but safe)
    const isSubscribed = user.subscriptionStatus === 'active';
    const canDownload = isSubscribed || user.downloadCount < 3;

    if (!canDownload) {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Download quota exceeded',
          needsSubscription: true,
        }),
      };
    }

    // Create download record (without S3 key since file is client-side)
    const downloadId = randomUUID();
    const now = Date.now();

    await docClient.send(
      new PutCommand({
        TableName: process.env.DOWNLOADS_TABLE!,
        Item: {
          userId,
          timestamp: now,
          downloadId,
          fileName,
          fileSize: fileSize || 0,
          wasFreeTier: !isSubscribed,
          clientSideDownload: true, // Flag to indicate this was a local download
          createdAt: now,
        },
      })
    );

    // Increment download count if free tier
    if (!isSubscribed) {
      await docClient.send(
        new UpdateCommand({
          TableName: process.env.USERS_TABLE!,
          Key: { userId },
          UpdateExpression: 'SET downloadCount = downloadCount + :inc, updatedAt = :now',
          ExpressionAttributeValues: {
            ':inc': 1,
            ':now': now,
          },
        })
      );
    }

    const remaining = isSubscribed ? -1 : 3 - (user.downloadCount + 1);

    console.log('Download tracked successfully:', { downloadId, userId, remaining });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        downloadId,
        remaining,
      }),
    };
  } catch (error) {
    console.error('Error tracking download:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
