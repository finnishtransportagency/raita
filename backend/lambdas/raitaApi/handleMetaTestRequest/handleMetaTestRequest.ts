import {
  startServerAndCreateLambdaHandler,
  handlers,
} from '@as-integrations/aws-lambda';
import { ApolloServer } from '@apollo/server';
import { raporttiTypeDefs } from '../../../apollo/schemas';
import { raporttiResolvers } from '../../../apollo/resolvers/raportti';

const server = new ApolloServer({
  typeDefs: raporttiTypeDefs,
  resolvers: raporttiResolvers,
});

export const handleMetaTestRequest = startServerAndCreateLambdaHandler(
  server,
  handlers.createALBEventRequestHandler(),
);
