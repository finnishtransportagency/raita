// General utils and helpers

import { RaitaSourceSystem, raitaSourceSystems } from '../constants';

/**
 * GetEnvContext can be used to provide free-form information about context in which getEnv function
 * is run. The given context is be included in possible error message if looked-after variable not found.
 */
type GetEnvContext = string;

/**
 * Returns an environment variable identified by name variable or throws an error
 * Inspiration from https://github.com/finnishtransportagency/hassu/blob/main/deployment/lib/config.ts
 */
export function getEnvOrFail(name: string, getEnvContext?: GetEnvContext) {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name}-environment variable has not been set${
        getEnvContext ? ` at context of ${getEnvContext}` : ''
      }`,
    );
  }
  return value;
}

/**
 * Returns getEnv function with preassigned GetEnvContext variable
 */
export const getGetEnvWithPreassignedContext =
  (getEnvContext: GetEnvContext) => (name: string) =>
    getEnvOrFail(name, getEnvContext);

/**
 * Returns true if parameter @s matches one of the Raita source systems
 */
export const isRaitaSourceSystem = (s: string) =>
  Object.values(raitaSourceSystems).includes(s as RaitaSourceSystem);
