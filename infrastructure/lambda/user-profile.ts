import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export const handler: APIGatewayProxyHandler = async (event) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': '*',
  };

  try {
    // Extract user ID from JWT (added by API Gateway authorizer)
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userId) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    const method = event.httpMethod;

    if (method === 'GET') {
      // Get user profile
      const result = await docClient.send(
        new GetCommand({
          TableName: process.env.USERS_TABLE!,
          Key: { userId },
        })
      );

      if (!result.Item) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'User not found' }),
        };
      }

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(result.Item),
      };
    }

    if (method === 'PUT') {
      // Update user profile
      const body = JSON.parse(event.body || '{}');
      const { fullName, avatarEmoji } = body;

      const updateExpression: string[] = [];
      const expressionAttributeNames: Record<string, string> = {};
      const expressionAttributeValues: Record<string, any> = {};

      if (fullName !== undefined) {
        updateExpression.push('#fullName = :fullName');
        expressionAttributeNames['#fullName'] = 'fullName';
        expressionAttributeValues[':fullName'] = fullName;
      }

      if (avatarEmoji !== undefined) {
        updateExpression.push('#avatarEmoji = :avatarEmoji');
        expressionAttributeNames['#avatarEmoji'] = 'avatarEmoji';
        expressionAttributeValues[':avatarEmoji'] = avatarEmoji;
      }

      if (updateExpression.length === 0) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'No valid fields to update' }),
        };
      }

      // Always update the updatedAt timestamp
      updateExpression.push('#updatedAt = :updatedAt');
      expressionAttributeNames['#updatedAt'] = 'updatedAt';
      expressionAttributeValues[':updatedAt'] = new Date().toISOString();

      const result = await docClient.send(
        new UpdateCommand({
          TableName: process.env.USERS_TABLE!,
          Key: { userId },
          UpdateExpression: `SET ${updateExpression.join(', ')}`,
          ExpressionAttributeNames: expressionAttributeNames,
          ExpressionAttributeValues: expressionAttributeValues,
          ReturnValues: 'ALL_NEW',
        })
      );

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(result.Attributes),
      };
    }

    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  } catch (error: any) {
    console.error('User profile error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
    };
  }
};
