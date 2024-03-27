import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import { RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { RaitaEnvironment } from './config';
import { getRemovalPolicy } from './utils';

/**
 * Creates a data bucket for the stacks
 */
export const createRaitaBucket = ({
  scope,
  name,
  raitaEnv,
  raitaStackIdentifier,
  versioned = false,
}: {
  scope: Construct;
  name: string;
  raitaEnv: RaitaEnvironment;
  raitaStackIdentifier: string;
  versioned?: boolean;
}) => {
  const removalPolicy = getRemovalPolicy(raitaEnv);
  const autoDeleteObjects = removalPolicy === RemovalPolicy.DESTROY;
  return new s3.Bucket(scope, name, {
    bucketName: `s3-${raitaStackIdentifier}-${name}`,
    removalPolicy,
    autoDeleteObjects,
    versioned,
    accessControl: s3.BucketAccessControl.PRIVATE,
    blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
    encryption: s3.BucketEncryption.S3_MANAGED,
  });
};

/**
 * Creates service role with based on AWS managed policy
 * identified by policyName
 */
export const createRaitaServiceRole = ({
  scope,
  name,
  servicePrincipal,
  policyName,
  raitaStackIdentifier,
}: {
  scope: Construct;
  name: string;
  servicePrincipal: string;
  policyName?: string;
  raitaStackIdentifier: string;
}) => {
  return new iam.Role(scope, name, {
    roleName: `${name}-${raitaStackIdentifier}`,
    assumedBy: new iam.ServicePrincipal(servicePrincipal),
    managedPolicies: policyName
      ? [iam.ManagedPolicy.fromAwsManagedPolicyName(policyName)]
      : [],
  });
};
