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
import { RaitaEnvironment } from './config';
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';

interface ResourceNestedStackProps extends NestedStackProps {
  readonly raitaStackId: string;
  readonly raitaEnv: RaitaEnvironment;
  readonly dataBucket: Bucket;
  readonly lambdaServiceRole: Role;
  readonly userPool: UserPool;
  readonly openSearchDomainEndpoint: string;
  readonly openSearchMetadataIndex: string;
}

export class RaitaGatewayStack extends NestedStack {
  constructor(scope: Construct, id: string, props: ResourceNestedStackProps) {
    super(scope, id, props);
    const {
      raitaStackId,
      raitaEnv,
      lambdaServiceRole,
      openSearchDomainEndpoint,
      openSearchMetadataIndex,
    } = props;

    const authorizer = new CognitoUserPoolsAuthorizer(this, 'api-authorizer', {
      authorizerName: `alpha-userpool-authorizer-${raitaStackId}-raita`,
      cognitoUserPools: [props.userPool],
    });

    // TODO: Assess lambdaRole requirements and implement least privilege
    const urlGeneratorFn = this.createS3urlGenerator({
      name: 'file-access-handler',
      raitaStackId,
      lambdaRole: lambdaServiceRole,
      dataBucket: props.dataBucket,
    });

    const osQueryHandlerFn = this.createOpenSearchQueryHandler({
      name: 'os-query-handler',
      raitaStackId,
      lambdaRole: lambdaServiceRole,
      openSearchDomainEndpoint,
      openSearchMetadataIndex,
    });

    // TODO: Evaluate and choose restApi props
    const restApi = new RestApi(this, 'api', {
      restApiName: `restapi-${raitaStackId}-raita-api`,
      deploy: true,
      deployOptions: {
        stageName: raitaEnv,
      },
    });
    const fileResource = restApi.root.addResource('file');
    fileResource.addMethod('POST', new LambdaIntegration(urlGeneratorFn), {
      authorizer: authorizer,
      authorizationType: AuthorizationType.COGNITO,
    });
    const filesResource = restApi.root.addResource('files');
    fileResource.addMethod('POST', new LambdaIntegration(osQueryHandlerFn), {
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

  private createOpenSearchQueryHandler({
    name,
    raitaStackId,
    lambdaRole,
    openSearchDomainEndpoint,
    openSearchMetadataIndex,
  }: {
    name: string;
    raitaStackId: string;
    lambdaRole: Role;
    openSearchDomainEndpoint: string;
    openSearchMetadataIndex: string;
  }) {
    return new NodejsFunction(this, name, {
      functionName: `lambda-${raitaStackId}-${name}`,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: 'handleOpenSearchQuery',
      entry: path.join(
        __dirname,
        `../backend/lambdas/handleOpenSearchQuery/handleOpenSearchQuery.ts`,
      ),
      environment: {
        OPENSEARCH_DOMAIN: openSearchDomainEndpoint,
        METADATA_INDEX: openSearchMetadataIndex,
        REGION: this.region,
      },
      role: lambdaRole,
    });
  }
}
