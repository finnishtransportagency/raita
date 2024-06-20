import {
  startServerAndCreateLambdaHandler,
  handlers,
} from '@as-integrations/aws-lambda';
import { ApolloServer, ApolloServerPlugin } from '@apollo/server';
import { lambdaRequestTracker } from 'pino-lambda';
import {
  raporttiTypeDefs,
  commonTypeDefs,
  mittausTypeDefs,
} from '../../../../apollo/schemas';
import { raporttiResolvers } from '../../../../apollo/resolvers/raportti';
import { mittausResolvers } from '../../../../apollo/resolvers/mittaus';
import {
  RaitaUser,
  getUser,
  validateReadUser,
} from '../../../../utils/userService';
import { log } from '../../../../utils/logger';
import { GraphQLError } from 'graphql';
import { getGetEnvWithPreassignedContext } from '../../../../../utils';

function getLambdaConfigOrFail() {
  const getEnv = getGetEnvWithPreassignedContext('handleV2FilesRequest');
  return {
    csvGenerationLambda: getEnv('CSV_GENERATION_LAMBDA'),
    region: getEnv('REGION'),
  };
}

const logPlugin: ApolloServerPlugin<{}> = {
  requestDidStart: async requestContext => {
    return {
      didResolveOperation: async requestContext => {
        log.info(
          {
            operation: requestContext.operationName,
            variables: requestContext.request.variables,
          },
          'Operation resolved',
        );
      },
    };
  },
};

const server = new ApolloServer({
  typeDefs: [raporttiTypeDefs, commonTypeDefs, mittausTypeDefs],
  resolvers: {
    ...raporttiResolvers,
    ...mittausResolvers,
    Query: { ...raporttiResolvers.Query, ...mittausResolvers.Query },
    Mutation: { ...raporttiResolvers.Mutation, ...mittausResolvers.Mutation },
  },
  plugins: [logPlugin],
});

const withRequest = lambdaRequestTracker();

export const handleV2FilesRequest = startServerAndCreateLambdaHandler(
  server,
  handlers.createALBEventRequestHandler(),
  {
    context: async ({ event, context }) => {
      try {
        withRequest(event, context);
        const config = getLambdaConfigOrFail();
        const user = await getUser(event);
        await validateReadUser(user);
        log.info({ user }, 'Request start');
        return {
          user,
          region: config.region,
          csvGenerationLambda: config.csvGenerationLambda,
        };
      } catch (error) {
        log.error({ event, error }, 'Error in context handler');
        const status = error.statusCode ?? 500;
        throw new GraphQLError('Auth error', {
          extensions: {
            http: {
              status,
            },
          },
        });
      }
    },
  },
);
