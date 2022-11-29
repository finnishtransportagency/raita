import { isRaitaSourceSystem } from './utils';

// BEGIN duplicates from main code base

// Expected structure for zip file path parts is designated in the PathType type
// If the path parts are not following, processing the file will lead into data inconsistencies
// Only tuple length and source system are validated
export type ZipPath = [
  system: 'Meeri' | 'Emma' | 'Elli',
  year: string,
  campaign: string,
  date: string,
  fileName: string,
];

export function isZipPath(arg: Array<string>): arg is ZipPath {
  const [system] = arg;
  return arg.length === 5 && !!system && isRaitaSourceSystem(system);
}

// END duplicates

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
