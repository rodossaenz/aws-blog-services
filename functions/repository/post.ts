/**
 * https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/dynamodb-example-document-client.html
 */
//const repository = require('/opt/nodejs/repository');
const repository = require('/opt/nodejs/repository');
const schema = require('post-schema.json');

export const handler = async (event: any = {}): Promise<any> => {

  console.log("event", event);
  const response = repository(event,schema);
  console.log("response", response);

  return response;
};
