import { RemovalPolicy } from 'aws-cdk-lib';
import { RaitaEnvironment } from './config';

/**
 * Returns RemovalPolicy property value for stack resources based on given raita environment value
 */
export const getRemovalPolicy = (raitaEnv: RaitaEnvironment) =>
  raitaEnv === 'dev' ? RemovalPolicy.DESTROY : RemovalPolicy.RETAIN;
