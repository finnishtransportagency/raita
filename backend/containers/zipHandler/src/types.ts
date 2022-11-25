import { raitaSourceSystems } from './constants';

// Expected structure for zip file path parts is designated in the PathType type
// If the path parts are not following, processing the file will lead into data inconsistencies
// Only tuple length and source system are validated
export type PathTuple = [
  system: 'Meeri' | 'Emma' | 'Elli',
  year: string,
  campaign: string,
  date: string,
  fileName: string,
];

export function isPathTuple(arg: Array<string>): arg is PathTuple {
  const [system] = arg;
  return arg.length === 5 && !!system && isRaitaSourceSystem(system);
}

export interface EntryRecord {
  status: 'success' | 'failure';
  failureDescription: string;
  compressedSize: number;
  uncompressedSize: number;
}

export interface ExtractEntriesResult {
  entries: {
    success: Array<EntryRecord>;
    failure: Array<EntryRecord>;
  };
  streamError?: Error;
}

/**
 *  Duplicates logic from main project
 * TODO: To be removed if container is left with dependencties to other code
 * Returns true if parameter @s matches one of the Raita source systems
 */

export type RaitaSourceSystem =
  typeof raitaSourceSystems[keyof typeof raitaSourceSystems];

function isRaitaSourceSystem(arg: string): arg is RaitaSourceSystem {
  return Object.values(raitaSourceSystems).includes(arg as RaitaSourceSystem);
}
