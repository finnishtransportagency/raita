import * as s3 from 'aws-cdk-lib/aws-s3';
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
}: {
  scope: Construct;
  name: string;
  raitaEnv: RaitaEnvironment;
  raitaStackIdentifier: string;
}) => {
  const removalPolicy = getRemovalPolicy(raitaEnv);
  const autoDeleteObjects = removalPolicy === RemovalPolicy.DESTROY;
  return new s3.Bucket(scope, name, {
    bucketName: `s3-${raitaStackIdentifier}-${name}`,
    removalPolicy,
    autoDeleteObjects,
    versioned: false,
    accessControl: s3.BucketAccessControl.PRIVATE,
    blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
    encryption: s3.BucketEncryption.S3_MANAGED,
  });
};
