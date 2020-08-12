import * as cdk from '@aws-cdk/core';
import * as Lambda from '@aws-cdk/aws-lambda';
import * as DynamoDB from '@aws-cdk/aws-dynamodb';
import * as APIGateway from '@aws-cdk/aws-apigateway';
import * as EC2 from '@aws-cdk/aws-ec2';
import { Duration } from '@aws-cdk/core';

export class AwsBlogServicesStack extends cdk.Stack {

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {

    super(scope, id, props);

    const blogVpc = new EC2.Vpc(this, 'rodosdev-vpc', {
      cidr: '192.168.0.0/16',
      maxAzs: 2,
      subnetConfiguration: [{
        cidrMask: 24,
        name: 'isolatedSubnet',
        subnetType: EC2.SubnetType.ISOLATED,
      }],
      natGateways: 0
    });

    blogVpc.addGatewayEndpoint('rodosdev-vpc-endpoint-dynamodb', {
      service: EC2.GatewayVpcEndpointAwsService.DYNAMODB
    });

    /**
     * DYNAMODB
     */
    const postTable = new DynamoDB.Table(this, "rodosdev-table-post", {
      tableName: "rodosdev-table-post",
      partitionKey: { name: "id", type: DynamoDB.AttributeType.STRING },
      billingMode: DynamoDB.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    postTable.addGlobalSecondaryIndex({
      partitionKey: { name: "postType", type: DynamoDB.AttributeType.STRING },
      sortKey: { name: "createdAt", type: DynamoDB.AttributeType.NUMBER },
      indexName: "rodosdev-index-post-createdAt",
      projectionType: DynamoDB.ProjectionType.ALL
    });

    /**
     * LAMBDA
     */

    const nodejsLayer = new Lambda.LayerVersion(this, "rodosdev-layer-nodejs", {
      compatibleRuntimes: [Lambda.Runtime.NODEJS_12_X],
      code: new Lambda.AssetCode("layers/nodejs.zip"),
      layerVersionName: "NODEJS_LAYER"
    });

    const postCrudFunction = new Lambda.Function(this, "rodosdev-function-crud-post", {
      runtime: Lambda.Runtime.NODEJS_12_X,
      code: new Lambda.AssetCode('functions/repository'),
      handler: "post.handler",
      functionName: "rodosdev-function-crud-post",
      timeout: Duration.seconds(3),
      vpc: blogVpc,
      vpcSubnets: blogVpc.selectSubnets()
    });

    postCrudFunction.addLayers(nodejsLayer);
    postTable.grantReadWriteData(postCrudFunction);

    /**
     * API GATEWAY
     */

    const postLambdaIntegration = new APIGateway.LambdaIntegration(postCrudFunction);

    const blogAPI = new APIGateway.LambdaRestApi(this, 'rodosdev-api', {
      handler: postCrudFunction,
      restApiName: 'rodosdev-api',
      proxy: false
    });

    const postsResource = blogAPI.root.addResource('post');
    postsResource.addMethod('POST', postLambdaIntegration);
    postsResource.addMethod('GET', postLambdaIntegration);

    const postResource = postsResource.addResource('{id}');
    postResource.addMethod('GET', postLambdaIntegration);
    postResource.addMethod('PUT', postLambdaIntegration);
    postResource.addMethod('DELETE', postLambdaIntegration);

    addCorsOptions(postsResource);
    addCorsOptions(postResource);

  }
}

export function addCorsOptions(apiResource: APIGateway.IResource) {
  apiResource.addMethod('OPTIONS', new APIGateway.MockIntegration({
    integrationResponses: [{
      statusCode: '200',
      responseParameters: {
        'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
        'method.response.header.Access-Control-Allow-Origin': "'*'",
        'method.response.header.Access-Control-Allow-Credentials': "'false'",
        'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,GET,PUT,POST,DELETE'",
      },
    }],
    passthroughBehavior: APIGateway.PassthroughBehavior.NEVER,
    requestTemplates: {
      "application/json": "{\"statusCode\": 200}"
    },
  }), {
    methodResponses: [{
      statusCode: '200',
      responseParameters: {
        'method.response.header.Access-Control-Allow-Headers': true,
        'method.response.header.Access-Control-Allow-Methods': true,
        'method.response.header.Access-Control-Allow-Credentials': true,
        'method.response.header.Access-Control-Allow-Origin': true,
      },
    }]
  })
}
