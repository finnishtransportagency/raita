import { ALBEvent } from 'aws-lambda';
import { validateJwtToken } from './validateJwtToken';
import { isPermanentStack } from '../../lib/utils';
import { RaitaEnvironment } from '../../lib/config';
import { log } from './logger';
import { RaitaLambdaError } from '../lambdas/utils';

const ISSUER = process.env.JWT_TOKEN_ISSUER;
const STACK_ID = process.env.STACK_ID || '';
const ENVIRONMENT = process.env.ENVIRONMENT || '';

const STATIC_ROLES = {
  read: 'Raita_luku',
  // admin: 'Raita_admin',
};

export type RaitaUser = {
  uid: string;
  roles?: string[];
};

function parseRoles(roles: string): string[] | undefined {
  return roles
    ? roles
        .replace('\\', '')
        .split(',')
        .map(s => {
          const s1 = s.split('/').pop();
          if (s1) {
            return s1;
          }
          // tsc fails if undefined is returned here
          return '';
        })
        .filter(s => s)
    : undefined;
}

const getMockUser = (): RaitaUser => ({
  uid: 'MOCK_UID',
  roles: [STATIC_ROLES.read],
});

const parseUserFromEvent = async (event: ALBEvent): Promise<RaitaUser> => {
  const headers = event.headers;
  if (!headers) {
    log.error('Headers missing');
    throw new RaitaLambdaError('Headers missing', 400);
  }

  if (!ISSUER) {
    log.error('Issuer missing');
    throw new RaitaLambdaError('User validation failed', 500);
  }

  const jwt = await validateJwtToken(
    headers['x-amzn-oidc-accesstoken'],
    headers['x-amzn-oidc-data'],
    ISSUER,
  );

  if (!jwt) {
    throw new RaitaLambdaError('User validation failed', 500);
  }
  const roles = parseRoles(jwt['custom:rooli']);
  const user: RaitaUser = {
    uid: jwt['custom:uid'],
    roles,
  };
  return user;
};

const isReadUser = (user: RaitaUser) => user.roles?.includes(STATIC_ROLES.read);

export const getUser = async (event: ALBEvent): Promise<RaitaUser> => {
  if (!STACK_ID || !ENVIRONMENT) {
    log.error('STACK_ID or ENVIRONMENT missing!');
    throw new RaitaLambdaError('Error', 500);
  }
  if (!isPermanentStack(STACK_ID, ENVIRONMENT as RaitaEnvironment)) {
    return getMockUser();
  }
  return parseUserFromEvent(event);
};

/**
 * Checks if the user has necessary role for read access. Throws 403 Forbidden if not.
 * @param user User being validated
 */
export const validateReadUser = async (user: RaitaUser): Promise<void> => {
  if (!isReadUser(user)) {
    log.error(user, 'Forbidden: User is not a read user');
    throw new RaitaLambdaError('Forbidden', 403);
  }
};
