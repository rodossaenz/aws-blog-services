/**
 * https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/dynamodb-example-document-client.html
 */

const AWS = require('aws-sdk');
const UUID = require('uuid');
const SCHEMA = require('schema.json');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const tableName = SCHEMA.tableName;

export const handler = async (event: any = {}): Promise<any> => {

  console.log("event", event);
  let body = {};

  switch (event.httpMethod) {

    case 'GET': {

      const params = {
        TableName: tableName,
        Key: { 'id': event.pathParameters.id },
        ProjectionExpression: SCHEMA.tableAttributes
      };

      const result = await dynamodb.get(params).promise();
      body = result.Item;

      break;
    }
    case 'POST': {

      const data = JSON.parse(event.body);
      data.id = UUID.v1();
      data.createdAt = new Date().getTime();

      const params = {
        TableName: tableName,
        Item: data
      };

      await dynamodb.put(params).promise();
      body = data;

      break;
    }
    case 'PUT': {

      const data1 = JSON.parse(event.body);
      data1.id = event.pathParameters.id;
      data1.updatedAt = new Date().getTime();

      const paramsForGet = {
        TableName: tableName,
        Key: { 'id': event.pathParameters.id },
        ProjectionExpression: SCHEMA.tableAttributes
      };

      const result = await dynamodb.get(paramsForGet).promise();
      console.log("GET before PUT result", result);
      const data2 = result.Item;

      let data = {...data2, ...data1};
      console.log("PUT merged data", data);

      const params = {
        TableName: tableName,
        Item: data
      };

      await dynamodb.put(params).promise();
      body = data;

      break;
    }
    case 'DELETE': {

      const params = {
        TableName: tableName,
        Key: { 'id': event.pathParameters.id }
      };

      await dynamodb.delete(params).promise();
      body = params.Key;

      break;
    }
    default: {
      //statements; 
      break;
    }
  }

  console.log("body", body);

  const response = {
    "statusCode": 200,
    "headers": {
      "Content-Type": "application/json",
      "X-Name": "rodo"
    },
    "body": JSON.stringify(body)
  };

  return response;
};
