export type MetadataJsonEntry = {
  file_name: string;
  system?: string;
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
export type MetadataJson = {
  format_version: string;
  contents: MetadataJsonEntry[];
};

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
    throw new Error('Not found');
  }
  return found;
}
