import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { GetCommand, PutCommand, UpdateCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({});

interface User {
  userId: string;
  subscriptionStatus: string;
  downloadCount: number;
}

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  console.log('Download handler event:', JSON.stringify(event, null, 2));

  try {
    // Extract user ID from JWT claims
    const userId = event.requestContext.authorizer?.jwt.claims.sub as string;

    if (!userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { fileName, fileContent } = body; // fileContent should be base64 encoded

    if (!fileName || !fileContent) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing fileName or fileContent' }),
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
        body: JSON.stringify({ error: 'User not found' }),
      };
    }

    // Check quota
    const isSubscribed = user.subscriptionStatus === 'active';
    const canDownload = isSubscribed || user.downloadCount < 3;

    if (!canDownload) {
      return {
        statusCode: 403,
        body: JSON.stringify({
          error: 'Download quota exceeded',
          needsSubscription: true,
        }),
      };
    }

    // Upload file to S3
    const downloadId = randomUUID();
    const s3Key = `${userId}/${downloadId}/${fileName}`;
    const fileBuffer = Buffer.from(fileContent, 'base64');

    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.DOWNLOADS_BUCKET!,
        Key: s3Key,
        Body: fileBuffer,
        ContentType: 'application/octet-stream',
      })
    );

    // Generate presigned URL (15 minutes)
    const downloadUrl = await getSignedUrl(
      s3Client,
      new PutObjectCommand({
        Bucket: process.env.DOWNLOADS_BUCKET!,
        Key: s3Key,
      }),
      { expiresIn: 900 } // 15 minutes
    );

    // Create download record
    const now = Date.now();
    await docClient.send(
      new PutCommand({
        TableName: process.env.DOWNLOADS_TABLE!,
        Item: {
          userId,
          timestamp: now,
          downloadId,
          fileName,
          fileSize: fileBuffer.length,
          s3Key,
          wasFreeTier: !isSubscribed,
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

    console.log('Download created successfully:', downloadId);

    return {
      statusCode: 200,
      body: JSON.stringify({
        downloadUrl,
        downloadId,
        fileName,
        expiresIn: 900,
        remaining: isSubscribed ? -1 : 3 - (user.downloadCount + 1),
      }),
    };
  } catch (error) {
    console.error('Error handling download:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
