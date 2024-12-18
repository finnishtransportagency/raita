import { RemovalPolicy, aws_lambda_nodejs } from 'aws-cdk-lib';
import { EbsDeviceVolumeType, ISubnet } from 'aws-cdk-lib/aws-ec2';
import * as path from 'path';
import { readFileSync } from 'fs';
import {
  DEVELOPMENT_MAIN_STACK_ID,
  DEVELOPMENT_PREMAIN_STACK_ID,
  ENVIRONMENTS,
  PRODUCTION_STACK_ID,
} from '../constants';
import { DatabaseEnvironmentVariables, RaitaEnvironment } from './config';

/**
 * Returns RemovalPolicy property value for stack resources based on given raita environment value
 */
export const getRemovalPolicy = (raitaEnv: RaitaEnvironment) =>
  raitaEnv === ENVIRONMENTS.dev ? RemovalPolicy.DESTROY : RemovalPolicy.RETAIN;

/**
 * Returns whether the stack is the main development stack
 */
export const isDevelopmentMainStack = (
  stackId: string,
  raitaEnv: RaitaEnvironment,
) => stackId === DEVELOPMENT_MAIN_STACK_ID && raitaEnv === ENVIRONMENTS.dev;

/**
 * Returns whether the stack is the premain development stack
 */
export const isDevelopmentPreMainStack = (
  stackId: string,
  raitaEnv: RaitaEnvironment,
) => stackId === DEVELOPMENT_PREMAIN_STACK_ID && raitaEnv === ENVIRONMENTS.dev;

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
 * Get environment variables needed to log into the database.
 * Password is not returned here and should be retrieved from secrets manager
 */
export const getDatabaseEnvironmentVariables = (
  stackId: string,
  raitaEnv: RaitaEnvironment,
): DatabaseEnvironmentVariables => {
  // TODO: use same method as flyway conf

  if (
    !isProductionStack(stackId, raitaEnv) &&
    !isDevelopmentMainStack(stackId, raitaEnv) &&
    !isDevelopmentPreMainStack(stackId, raitaEnv)
  ) {
    // for non-permanent stacks use _template_ config file and stackid as schema name
    const file = readFileSync(
      path.join(__dirname, `../backend/db/conf/_template_/env.json`),
      'utf8',
    );
    const replaced = file.replace('_schema_', stackId);
    return JSON.parse(replaced);
  }
  const file = readFileSync(
    path.join(__dirname, `../backend/db/conf/${stackId}/env.json`),
    'utf8',
  );
  return JSON.parse(file);
};

/**
 * These should be given as bundling options to NodeJsFunction that uses Prisma
 * Prisma layer is also needed
 */
export const prismaBundlingOptions: aws_lambda_nodejs.BundlingOptions = {
  externalModules: ['@prisma'], // this is provided by the lambda layer so mark it as external
};

/**
 * Needed for graphql lambdas
 */
export const graphqlBundlingOptions: aws_lambda_nodejs.BundlingOptions = {
  loader: { '.graphql': 'text' },
};
