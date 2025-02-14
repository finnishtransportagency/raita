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

export interface ZipFileData {
  timeStamp: string;
  timeStampType: string;
  fileName: string;
  metadata: { [key: string]: string };
}
// accept only data from these test producers
const TestProducers = ['TEST_PRODUCER_1', 'TEST_PRODUCER_2'];

/**
 * Check is given path is a possible zip file path
 */
export function isPossibleZipPath(arg: Array<string>): arg is ZipPath {
  // simplify path structure proto: 3 levels only
  const [system] = arg;
  return arg.length === 3 && !!system && TestProducers.includes(system);
}

// END duplicates

export interface EntryRecord {
  fileName: string;
  status: 'success' | 'error' | 'skipped';
  errorDescription: string;
  compressedSize: number;
  uncompressedSize: number;
}

export interface ExtractEntriesResult {
  entries: {
    success: Array<EntryRecord>;
    error: Array<EntryRecord>;
    skipped: Array<EntryRecord>;
  };
  streamError?: Error;
}
