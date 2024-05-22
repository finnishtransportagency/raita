import { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: '../backend/apollo/schemas/*.graphql',
  documents: ['./shared/graphql/queries/*.ts'],
  generates: {
    './shared/graphql/__generated__/': {
      preset: 'client',
      presetConfig: {
        gqlTagName: 'gql',
      },
    },
  },
};

export default config;
