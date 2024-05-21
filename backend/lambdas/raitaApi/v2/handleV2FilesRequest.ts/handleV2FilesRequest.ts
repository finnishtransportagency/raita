import {
  startServerAndCreateLambdaHandler,
  handlers,
} from '@as-integrations/aws-lambda';
import { ApolloServer } from '@apollo/server';
import { raporttiTypeDefs } from '../../../../apollo/schemas';
import { raporttiResolvers } from '../../../../apollo/resolvers/raportti';
import { getUser, validateReadUser } from '../../../../utils/userService';
import { getRaitaLambdaErrorResponse } from '../../../utils';
import { log } from '../../../../utils/logger';

const server = new ApolloServer({
  typeDefs: raporttiTypeDefs,
  resolvers: raporttiResolvers,
});

export const handleV2FilesRequest = startServerAndCreateLambdaHandler(
  server,
  handlers.createALBEventRequestHandler(),
  {
    middleware: [
      async event => {
        // if middleware returns something that is not a function, it is returned immediately and apollo handler is not called
        // use this to return authorization errors
        try {
          const user = await getUser(event);
          await validateReadUser(user);
          return;
        } catch (err) {
          log.error(err);
          return getRaitaLambdaErrorResponse(err);
        }
      },
    ],
  },
);
