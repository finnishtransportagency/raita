import { ALBEvent, ALBEventHeaders } from 'aws-lambda';
import { validateJwtToken } from './validateJwtToken';
import { isDevelopmentPreMainStack, isPermanentStack } from '../../lib/utils';
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

//EntraID tuottaa käyttäjän roolitiedon JWTokenille eri muodossa kuin nykyisin käytössä oleva OAM. Sovelluksen tulee jatkossa kyetä vastaanottamaan käyttäjän roolitieto molemmissa muodoissa.
// OAM: custom:rooli "sovellus_role1,sovellus_role2"
// EntraID: custom:rooli "[\"sovellus_role1\",\"sovellus_role2\"]"

const STATIC_ROLES = {
  read: 'Raita_luku',
  admin: 'Raita_admin',
  extended: 'Raita_extended',
};

export type RaitaUser = {
  uid: string;
  roles?: string[];
};

export function parseRoles(roles: string): string[] | undefined {
  return roles
    ? roles
        .replace(/\"/g, '')
        .replace(/\[/g, '')
        .replace(/\]/g, '')
        .replace(/\\/g, '')
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

/**
 * Used only for tests and non-permanent stacks
 */
const getMockUser = (): RaitaUser => ({
  uid: 'MOCK_UID',
  roles: [STATIC_ROLES.read, STATIC_ROLES.admin],
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
  if (isDevelopmentPreMainStack(STACK_ID, ENVIRONMENT as RaitaEnvironment)) {
    // grant all roles to api key requests in premain env for development
    return {
      uid: RAITA_APIKEY_USER_UID,
      roles: [
        STATIC_ROLES.read,
        STATIC_ROLES.extended,
        STATIC_ROLES.admin,
      ],
    };
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
    headers['x-iam-accesstoken'],
    headers['x-iam-data'],
    ISSUER,
  );

  if (jwt) log.info(jwt, 'jwt decoded');

  if (!jwt) {
    throw new RaitaLambdaError('User validation failed', 500);
  }
  const roles = parseRoles(jwt['custom:rooli']);
  if (roles) log.info(roles, 'roles parsed');
  const user: RaitaUser = {
    uid: jwt['custom:uid'],
    roles: roles ? filterRaitaRoles(roles) : [],
  };
  if (user.roles) log.info(user.roles, 'roles filtered');
  return user;
};

/**
 * Get only roles useful for Raita
 */
const filterRaitaRoles = (roles: string[]) => {
  const raitaRoles = Object.values(STATIC_ROLES);
  return roles.filter(role => raitaRoles.includes(role));
};

const parseUserFromEvent = async (event: ALBEvent): Promise<RaitaUser> => {
  const headers = event.headers;

  if (!headers) {
    log.error('Headers missing');
    throw new RaitaLambdaError('Headers missing', 400);
  }

  log.info(headers, 'parseUserFromEvent headers');
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

const isReadUser = (user: RaitaUser) => {
  const userRoles = user.roles ?? [];
  const allowedRoles = [
    STATIC_ROLES.read,
    STATIC_ROLES.extended,
    STATIC_ROLES.admin,
  ];
  const matchingRole = allowedRoles.find(role => userRoles.includes(role));
  return !!matchingRole;
};
const isExtendedUser = (user: RaitaUser) => {
  const userRoles = user.roles ?? [];
  const allowedRoles = [STATIC_ROLES.extended, STATIC_ROLES.admin];
  const matchingRole = allowedRoles.find(role => userRoles.includes(role));
  return !!matchingRole;
};
const isAdminUser = (user: RaitaUser) => {
  const userRoles = user.roles ?? [];
  const allowedRoles = [STATIC_ROLES.admin];
  const matchingRole = allowedRoles.find(role => userRoles.includes(role));
  return !!matchingRole;
};

export const getUser = async (event: ALBEvent): Promise<RaitaUser> => {
  log.info(event, 'getUser ALBEvent');
  if (!STACK_ID || !ENVIRONMENT) {
    log.error('STACK_ID or ENVIRONMENT missing!');
    throw new RaitaLambdaError('Error', 500);
  }
  if (
    !isPermanentStack(STACK_ID, ENVIRONMENT as RaitaEnvironment) &&
    !isDevelopmentPreMainStack(STACK_ID, ENVIRONMENT as RaitaEnvironment)
  ) {
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
/**
 * Checks if the user has necessary role for extended access. Throws 403 Forbidden if not.
 * @param user User being validated
 */
export const validateExtendedUser = async (user: RaitaUser): Promise<void> => {
  if (!isExtendedUser(user)) {
    log.error(user, 'Forbidden: User is not an extended user');
    throw new RaitaLambdaError('Forbidden', 403);
  }
};
/**
 * Checks if the user has necessary role for extended access. Throws 403 Forbidden if not.
 * @param user User being validated
 */
export const validateAdminUser = async (user: RaitaUser): Promise<void> => {
  if (!isAdminUser(user)) {
    log.error(user, 'Forbidden: User is not an admin user');
    throw new RaitaLambdaError('Forbidden', 403);
  }
};
