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
  readonly raitaStackId: string;
  readonly dataBucket: Bucket;
  readonly lambdaServiceRole: Role;
  readonly userPool: UserPool;
}

export class RaitaGatewayStack extends NestedStack {
  constructor(scope: Construct, id: string, props: ResourceNestedStackProps) {
    super(scope, id, props);
    const { raitaStackId } = props;

    const restApi = new RestApi(this, 'api', {
      restApiName: `restapi-${raitaStackId}-raita-api`,
      deploy: true,
    });

    const authorizer = new CognitoUserPoolsAuthorizer(this, 'api-authorizer', {
      authorizerName: `userpool-authorizer-${raitaStackId}-raita`,
      cognitoUserPools: [props.userPool],
    });

    // TODO: Assess lambdaRole requirements and implement least privilege
    const urlGenerator = this.createS3urlGenerator({
      name: 'file-access-handler',
      raitaStackId,
      lambdaRole: props.lambdaServiceRole,
      dataBucket: props.dataBucket,
    });

    const test = restApi.root
      .addResource('files')
      .addMethod('POST', new LambdaIntegration(urlGenerator), {
        methodResponses: [
          { statusCode: '200' },
          { statusCode: '400' },
          { statusCode: '500' },
        ],
        authorizer: authorizer,
        authorizationType: AuthorizationType.COGNITO,
      });

    test.node.addDependency(restApi);
    test.node.addDependency(authorizer);
  }

  /**
   * Returns lambda function that generates presigned urls
   */
  private createS3urlGenerator({
    name,
    raitaStackId,
    dataBucket,
    lambdaRole,
  }: {
    name: string;
    raitaStackId: string;
    dataBucket: Bucket;
    lambdaRole: Role;
  }) {
    return new NodejsFunction(this, name, {
      functionName: ``,
      memorySize: 1024,
      timeout: Duration.seconds(5),
      runtime: Runtime.NODEJS_16_X,
      handler: 'handleFileRequest',
      entry: path.join(
        __dirname,
        `../backend/lambdas/s3UrlGenerator/s3UrlGenerator.ts`,
      ),
      environment: {
        DATA_BUCKET: dataBucket.bucketName,
      },
      role: lambdaRole,
    });
  }
}
