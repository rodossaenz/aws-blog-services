/**
 * https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/dynamodb-example-document-client.html
 */

const AWS = require('aws-sdk');
const UUID = require('uuid');

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function repository(event: any = {}, schema: any) {

  const tableName = schema.tableName;

  console.log("event", event);
  let body = {};
  let statusCode: number = 200;

  try {

    switch (event.httpMethod) {

      case 'GET': {

        if(event.pathParameters !== null && 'id' in event.pathParameters){

          const params = {
            TableName: tableName,
            Key: { 'id': event.pathParameters.id },
            ProjectionExpression: schema.tableAttributes
          };

          const result = await dynamodb.get(params).promise();
          body = result.Item;

        } else {

          var params = {
            TableName : tableName,
            ProjectionExpression: schema.tableAttributes,
            KeyConditionExpression: "#time >= :time",
            ExpressionAttributeNames:{
                "#time": "createdAt"
            },
            ExpressionAttributeValues: {
                ":time": new Date().getTime()
            }
          };
        
          const result = await dynamodb.query(params).promise();
          body = result.Items;

        }

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
          ProjectionExpression: schema.tableAttributes
        };

        const result = await dynamodb.get(paramsForGet).promise();
        console.log("GET before PUT result", result);
        const data2 = result.Item;

        let data = { ...data2, ...data1 };
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

  } catch (error) {
    statusCode = 500;
    body = error;
  }

  console.log("body", body);

  const response = {
    "statusCode": statusCode,
    "headers": {
      "Content-Type": "application/json",
    },
    "body": JSON.stringify(body)
  };

  return response;
};

module.exports = repository;
