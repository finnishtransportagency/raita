import A from 'axios';

/**
 * This is only used for the backend whiel running in a dev env, e.g. locally.
 * @deprecated
 */
export const client = A.create({
  baseURL: process.env.ES_CONNSTRING,
});

/**
 * The REST client that's used for accessing the OpenSearch endpoint.
 * Configuration for requests should be placed here.
 */
export const webClient = A.create({
  baseURL: '/api',
});
