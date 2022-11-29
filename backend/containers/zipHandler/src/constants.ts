/**
 * Constants below are duplicates from the main code base
 */
export const ZIP_SUFFIX = 'zip';
export type RaitaSourceSystem =
  typeof raitaSourceSystems[keyof typeof raitaSourceSystems];
export const raitaSourceSystems = {
  Meeri: 'Meeri',
  Emma: 'Emma',
  Elli: 'Elli',
} as const;
