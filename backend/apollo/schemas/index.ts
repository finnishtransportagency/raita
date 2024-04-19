import { readFileSync } from 'fs';

export const raporttiTypeDefs = readFileSync('./raportti.graphql', {
  encoding: 'utf-8',
});
