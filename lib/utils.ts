import { RemovalPolicy } from 'aws-cdk-lib';
import {
  DEVELOPMENT_MAIN_STACK_ID,
  ENVIRONMENTS,
  PRODUCTION_STACK_ID,
} from '../constants';
import { RaitaEnvironment } from './config';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

/**
 * Returns RemovalPolicy property value for stack resources based on given raita environment value
 */
export const getRemovalPolicy = (raitaEnv: RaitaEnvironment) =>
  raitaEnv === 'dev' ? RemovalPolicy.DESTROY : RemovalPolicy.RETAIN;

/**
 * Returns whether the stack is the main development stack
 */
export const isDevelopmentMainStack = (
  stackId: string,
  raitaEnv: RaitaEnvironment,
) => stackId === DEVELOPMENT_MAIN_STACK_ID && raitaEnv === ENVIRONMENTS.dev;

/**
 * Returns whether the stack is the production stack
 */
export const isProductionStack = (
  stackId: string,
  raitaEnv: RaitaEnvironment,
) => stackId === PRODUCTION_STACK_ID && raitaEnv === ENVIRONMENTS.prod;

/**
 * Returns whether the stack is one of the two permanent Raita stacks
 * - development main stack that corresponds to development main branch in Github
 * - producition stack that corresponds to production branch in Github
 */
export const isPermanentStack = (stackId: string, raitaEnv: RaitaEnvironment) =>
  isDevelopmentMainStack(stackId, raitaEnv) ||
  isProductionStack(stackId, raitaEnv);

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
    removalPolicy: getRemovalPolicy(raitaEnv),
    autoDeleteObjects,
    versioned: false,
    accessControl: s3.BucketAccessControl.PRIVATE,
    blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
    encryption: s3.BucketEncryption.S3_MANAGED,
  });
};

export const getRaitaS3BucketProps = ({
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
  return {
    bucketName: `s3-${raitaStackIdentifier}-${name}`,
    removalPolicy: getRemovalPolicy(raitaEnv),
    autoDeleteObjects,
    versioned: false,
    accessControl: s3.BucketAccessControl.PRIVATE,
    blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
    encryption: s3.BucketEncryption.S3_MANAGED,
  };
};
