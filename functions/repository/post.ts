/**
 * https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/dynamodb-example-document-client.html
 */

import { isArray } from "util";

//const repository = require('/opt/nodejs/repository');
const repository = require('/opt/nodejs/repository');
const schema = require('post-schema.json');

export const handler = async (event: any = {}): Promise<any> => {

  console.log("event", event);

  const request = {
    "httpMethod" : event.httpMethod,
    "pathParameters" : event.pathParameters,
    "body" : event.body
  }

  const response = repository(request,schema);
  
  console.log("response", response);

  return response;
};
