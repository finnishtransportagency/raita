import { ALBEvent, ALBEventHeaders } from 'aws-lambda';
import { validateJwtToken } from './validateJwtToken';
import { isPermanentStack } from '../../lib/utils';
import { RaitaEnvironment } from '../../lib/config';
import { log } from './logger';
import { getSSMParameter } from './ssm';
import { RaitaLambdaError } from '../lambdas/utils';
import {
  RAITA_APIKEY_USER_UID,
  REQUEST_HEADER_API_KEY,
  SSM_API_KEY,
} from '../../constants';

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

const handleApiKeyRequest = async (
  requestApiKey: string,
): Promise<RaitaUser> => {
  const ssmApiKey = await getSSMParameter({
    parameterName: SSM_API_KEY,
    encrypted: true,
  });
  if (!ssmApiKey) {
    log.error('Api key missing');
    throw new RaitaLambdaError('Error', 500);
  }
  if (ssmApiKey !== requestApiKey) {
    throw new RaitaLambdaError('Forbidden', 403);
  }
  return {
    uid: RAITA_APIKEY_USER_UID,
    roles: [STATIC_ROLES.read],
  };
};

const handleOidcRequest = async (
  headers: ALBEventHeaders,
): Promise<RaitaUser> => {
  if (!ISSUER) {
    log.error('Issuer missing');
    throw new RaitaLambdaError('User validation failed', 500);
  }

  const jwt = await validateJwtToken(
    headers['x-Iam-Accesstoken'],
    headers['x-Iam-Data'],
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

const parseUserFromEvent = async (event: ALBEvent): Promise<RaitaUser> => {
  const headers = event.headers;
  if (!headers) {
    log.error('Headers missing');
    throw new RaitaLambdaError('Headers missing', 400);
  }
  /**
   * If request has api key header present, authentication/authorization is based solely on that,
   * not on possible oidc-headers.
   */
  const requestApiKey = headers[REQUEST_HEADER_API_KEY];
  if (requestApiKey) {
    return handleApiKeyRequest(requestApiKey);
  }
  return handleOidcRequest(headers);
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
