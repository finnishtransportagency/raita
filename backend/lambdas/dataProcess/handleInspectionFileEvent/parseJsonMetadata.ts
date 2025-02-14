import { log } from '../../../utils/logger';

export type MetadataJsonEntry = {
  file_name: string;
  file_type?: string;
  system?: string;
  report_type?: string;
  track_number?: number;
  track_part?: string;
  track_id?: number;
  km_start?: string;
  km_end?: string;
  campaign?: string;
  year?: number;
  inspection_date?: string;
  version?: string;
  note?: string;
};
/**
 * Definition of metadata file that is parsed from JSON
 */
export type MetadataJson = {
  format_version: string;
  contents: MetadataJsonEntry[];
};

/**
 * Get expected metadata file key for a file
 */
export function getMetadataFileKey(key: string) {
  const path = key.split('/');
  const metadataFileName = 'metadata.json';
  const metadataPath = path.slice(0, path.length - 1).join('/');
  const metadataKey = `${metadataPath}/${metadataFileName}`;
  return metadataKey;
}

export function parseMetadataFile(file: string) {
  const metadata: MetadataJson = JSON.parse(file);
  // TODO: need validation?
  return metadata;
}

export function extractSingleFileMetadata(metadata: MetadataJson, key: string) {
  if (!metadata || !metadata.contents) {
    throw new Error();
  }
  // assume key is valid
  const split = key.split('/');
  const fileName = split[split.length - 1];
  const found = metadata.contents.find(entry => entry.file_name === fileName);
  if (!found) {
    log.error('metadata not found in file');
    throw new Error('Not found');
  }
  return {
    file_name: found.file_name ?? null,
    file_type: found.file_type ?? null,
    system: found.system ?? null,
    report_type: found.report_type ?? null,
    track_number: found.track_number ?? null,
    track_part: found.track_part ?? null,
    track_id: found.track_id ?? null,
    km_start: found.km_start ?? null,
    km_end: found.km_end ?? null,
    campaign: found.campaign ?? null,
    year: found.year ?? null,
    inspection_date: found.inspection_date ?? null,
  };
}
