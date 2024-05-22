import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: 'backend/apollo/schemas/*.graphql',
  generates: {
    'backend/apollo/__generated__/resolvers-types.ts': {
      plugins: ['typescript', 'typescript-resolvers'],
      config: {
        useIndexSignature: true,
        mappers: {
          // define mappings from graphql model type to prisma model type
          Raportti: '@prisma/client#raportti',
        },
      },
    },
    // './graphql.schema.json': { // TODO is this useful?
    //   plugins: ['introspection'],
    // },
  },
};

export default config;
