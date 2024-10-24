import { ApolloClient, InMemoryCache } from '@apollo/client';
import { baseURL } from 'shared/config';

export const apolloClient = new ApolloClient({
  uri: `${baseURL}/v2/graphql`,
  cache: new InMemoryCache(),
});
