import { RemovalPolicy } from 'aws-cdk-lib';
import { EbsDeviceVolumeType, ISubnet } from 'aws-cdk-lib/aws-ec2';
import { DomainProps } from 'aws-cdk-lib/aws-opensearchservice';
import {
  DEVELOPMENT_MAIN_STACK_ID,
  ENVIRONMENTS,
  PRODUCTION_STACK_ID,
} from '../constants';
import { RaitaEnvironment } from './config';

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
 * Returns env dependent OpenSearch configuration properties
 */
export const getEnvDependentOsConfiguration = (
  env: RaitaEnvironment,
  subnets: ISubnet[],
) => {
  const envDependentProperties: Record<
    RaitaEnvironment,
    Partial<DomainProps>
  > = {
    prod: {
      removalPolicy: getRemovalPolicy(env),
      ebs: {
        volumeSize: 200,
        volumeType: EbsDeviceVolumeType.GENERAL_PURPOSE_SSD_GP3,
      },
      capacity: {
        masterNodes: 3,
        masterNodeInstanceType: 'm6g.large.search',
        dataNodes: 2,
        dataNodeInstanceType: 'm6g.large.search',
      },
      // Must be enabled if VPC contains multiple private subnets.
      zoneAwareness: {
        enabled: true,
        availabilityZoneCount: subnets.length,
      },
      vpcSubnets: [
        {
          subnets: subnets,
        },
      ],
    },
    dev: {
      removalPolicy: getRemovalPolicy(env),
      ebs: {
        volumeSize: 10,
        volumeType: EbsDeviceVolumeType.GENERAL_PURPOSE_SSD,
      },
      capacity: {
        dataNodes: 1,
        dataNodeInstanceType: 't3.small.search',
      },
      vpcSubnets: [
        {
          subnets: subnets.slice(0, 1),
        },
      ],
    },
  };
  return envDependentProperties[env];
};
