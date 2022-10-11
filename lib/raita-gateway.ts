import {
  Duration,
  NestedStack,
  NestedStackProps,
  Stack,
  StackProps,
} from 'aws-cdk-lib';
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
import { RaitaEnvironment } from './config';

interface ResourceNestedStackProps extends StackProps {
  readonly raitaStackId: string;
  readonly raitaEnv: RaitaEnvironment;
  readonly dataBucket: Bucket;
  readonly lambdaServiceRole: Role;
  readonly userPool: UserPool;
}

export class RaitaGatewayStack extends Stack {
  constructor(scope: Construct, id: string, props: ResourceNestedStackProps) {
    super(scope, id, props);
    const { raitaStackId, raitaEnv } = props;

    const authorizer = new CognitoUserPoolsAuthorizer(this, 'api-authorizer', {
      authorizerName: `alpha-userpool-authorizer-${raitaStackId}-raita`,
      cognitoUserPools: [props.userPool],
    });

    // TODO: Assess lambdaRole requirements and implement least privilege
    const urlGeneratorFn = this.createS3urlGenerator({
      name: 'file-access-handler',
      raitaStackId,
      lambdaRole: props.lambdaServiceRole,
      dataBucket: props.dataBucket,
    });

    // TODO: Evaluate and choose restApi props
    const restApi = new RestApi(this, 'api', {
      restApiName: `restapi-${raitaStackId}-raita-api`,
      deploy: true,
      deployOptions: {
        stageName: raitaEnv,
      },
    });
    const filesResource = restApi.root.addResource('files');
    filesResource.addMethod('POST', new LambdaIntegration(urlGeneratorFn), {
      authorizer: authorizer,
      authorizationType: AuthorizationType.COGNITO,
    });
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
      functionName: `lambda-${raitaStackId}-${name}`,
      memorySize: 1024,
      timeout: Duration.seconds(5),
      runtime: Runtime.NODEJS_16_X,
      handler: 'handleFileRequest',
      entry: path.join(
        __dirname,
        `../backend/lambdas/handleFileRequest/handleFileRequest.ts`,
      ),
      environment: {
        DATA_BUCKET: dataBucket.bucketName,
      },
      role: lambdaRole,
    });
  }
}
