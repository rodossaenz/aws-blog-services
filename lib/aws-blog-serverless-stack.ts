import * as cdk from '@aws-cdk/core';
import * as Lambda from '@aws-cdk/aws-lambda';
import * as DynamoDB from '@aws-cdk/aws-dynamodb';
import * as APIGateway from '@aws-cdk/aws-apigateway';
import * as EC2 from '@aws-cdk/aws-ec2';
import { Duration } from '@aws-cdk/core';

export class AwsBlogServerlessStack extends cdk.Stack {

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {

    super(scope, id, props);

    const blogVpc = new EC2.Vpc(this, 'BlogVPC', {
      cidr: '192.168.0.0/16',
      maxAzs: 2,
      subnetConfiguration: [{
        cidrMask: 24,
        name: 'isolatedSubnet',
        subnetType: EC2.SubnetType.ISOLATED,
      }],
      natGateways: 0
    });

    blogVpc.addGatewayEndpoint('BlogVPCEndpointDynamoDB', {
      service: EC2.GatewayVpcEndpointAwsService.DYNAMODB
    });

    /**
     * DYNAMODB
     */
    const articleTable = new DynamoDB.Table(this, "article", {
      partitionKey: { name: "id", type: DynamoDB.AttributeType.STRING },
      tableName: "article",
      billingMode: DynamoDB.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    /**
     * LAMBDA
     */

    const nodejsLayer = new Lambda.LayerVersion(this, "nodejs-layer", {
      compatibleRuntimes: [Lambda.Runtime.NODEJS_12_X],
      code: new Lambda.AssetCode("layers/nodejs.zip"),
      layerVersionName: "NODEJS_LAYER"
    });

    const articleCrudFunction = new Lambda.Function(this, "article-crud", {
      runtime: Lambda.Runtime.NODEJS_12_X,
      code: new Lambda.AssetCode('functions/repository'),
      handler: "article.handler",
      functionName: "article-crud",
      timeout: Duration.seconds(3),
      vpc: blogVpc,
      vpcSubnets: blogVpc.selectSubnets()
    });

    articleCrudFunction.addLayers(nodejsLayer);
    articleTable.grantReadWriteData(articleCrudFunction);

    /**
     * API GATEWAY
     */

    const articleLambdaIntegration = new APIGateway.LambdaIntegration(articleCrudFunction);

    const blogAPI = new APIGateway.LambdaRestApi(this, 'blog-api', {
      handler: articleCrudFunction,
      restApiName: 'blog-api',
      proxy: false
    });

    const articlesResource = blogAPI.root.addResource('articles');
    articlesResource.addMethod('POST', articleLambdaIntegration);

    const articleResource = articlesResource.addResource('{id}');
    articleResource.addMethod('GET', articleLambdaIntegration);
    articleResource.addMethod('PUT', articleLambdaIntegration);
    articleResource.addMethod('DELETE', articleLambdaIntegration);

    addCorsOptions(articlesResource);
    addCorsOptions(articleResource);

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
