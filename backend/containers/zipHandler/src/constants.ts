export const ZIP_SUFFIX = 'zip';

/**
 * The below duplicates the definition from src/constants
 * TODO: To be removed if container is left with dependencties to other code
 */
export type RaitaSourceSystem =
  typeof raitaSourceSystems[keyof typeof raitaSourceSystems];
export const raitaSourceSystems = {
  Meeri: 'Meeri',
  Emma: 'Emma',
  Elli: 'Elli',
} as const;
