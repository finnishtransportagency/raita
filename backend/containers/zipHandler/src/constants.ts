/**
 * Constants below are duplicates from the main code base
 */
export const ZIP_SUFFIX = 'zip';
export const AVI_SUFFIX = 'avi';

// In mermec data TVSS videos are nested in the folders listed in RAITA_DATA_VIDEO_FOLDERS
// Note: To make configuration more dynamic, SSM Parameter Store could be used to store the values
export const RAITA_DATA_VIDEO_FOLDERS = ['DriversView'];
export const RAITA_DATA_VIDEO_SUFFIXES = [AVI_SUFFIX];

export type RaitaSourceSystem =
  typeof raitaSourceSystems[keyof typeof raitaSourceSystems];
export const raitaSourceSystems = {
  Meeri: 'Meeri',
  Emma: 'Emma',
  Elli: 'Elli',
} as const;
