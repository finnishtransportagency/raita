import { ApolloClient, InMemoryCache } from '@apollo/client';

export const apolloClient = new ApolloClient({
  uri: '/api/v2/files', // TODO: endpoint name
  cache: new InMemoryCache(),
});
