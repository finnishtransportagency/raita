import { Duration, NestedStack, NestedStackProps } from 'aws-cdk-lib';
import {
  AuthorizationType,
  CognitoUserPoolsAuthorizer,
  LambdaIntegration,
  RestApi,
} from 'aws-cdk-lib/aws-apigateway';
import { Role } from 'aws-cdk-lib/aws-iam';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import * as path from 'path';
import { UserPool } from 'aws-cdk-lib/aws-cognito';

interface ResourceNestedStackProps extends NestedStackProps {
  readonly dataBucket: Bucket;
  readonly lambdaServiceRole: Role;
  readonly userPool: UserPool;
}

export class RaitaGatewayStack extends NestedStack {
  constructor(scope: Construct, props: ResourceNestedStackProps) {
    super(scope, 'GatewayStack', props);

    const restApi = new RestApi(this, 'RaitaApi', {
      deploy: true,
    });

    const auth = new CognitoUserPoolsAuthorizer(this, 'raitaApiAuthorizer', {
      cognitoUserPools: [props.userPool],
    });

    const urlGenerator = this.createS3urlGenerator({
      name: 'fileAccessHandler',
      lambdaRole: props.lambdaServiceRole,
      dataBucket: props.dataBucket,
    });

    restApi.root
      .addResource('files')
      .addMethod('POST', new LambdaIntegration(urlGenerator), {
        methodResponses: [
          { statusCode: '200' },
          { statusCode: '400' },
          { statusCode: '500' },
        ],
        authorizer: auth,
        authorizationType: AuthorizationType.COGNITO,
      });
  }

  /**
   * Returns lambda function that generates presigned urls
   */
  private createS3urlGenerator({
    name,
    dataBucket,
    lambdaRole,
  }: {
    name: string;
    dataBucket: Bucket;
    lambdaRole: Role;
  }) {
    return new NodejsFunction(this, name, {
      memorySize: 1024,
      timeout: Duration.seconds(5),
      runtime: Runtime.NODEJS_16_X,
      handler: 'handleFileRequest',
      entry: path.join(__dirname, `../lambda/s3UrlGenerator/s3UrlGenerator.ts`),
      environment: {
        DATA_BUCKET: dataBucket.bucketName,
      },
      role: lambdaRole,
    });
  }
}
