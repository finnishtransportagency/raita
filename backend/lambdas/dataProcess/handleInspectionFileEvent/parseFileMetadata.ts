import { IExtractionSpec, IFileResult, ParseValueResult } from '../../../types';
import { KeyData } from '../../utils';
import {
  calculateHash,
  extractFileContentData,
  shouldParseContent,
} from './contentDataParser';
import { extractFileNameData } from './fileNameDataParser';
import { extractPathData } from './pathDataParser';

export async function parseFileMetadata({
  keyData,
  file,
  spec,
}: {
  keyData: KeyData;
  file: IFileResult;
  spec: IExtractionSpec;
}): Promise<{ metadata: ParseValueResult; hash: string }> {
  const { fileBody } = file;
  const fileNameData = extractFileNameData(
    keyData,
    spec.fileNameExtractionSpec,
  );
  const pathData = extractPathData(keyData, spec);
  const fileContentData =
    shouldParseContent(keyData.fileSuffix) && fileBody
      ? extractFileContentData(spec, fileBody)
      : {};
  const hash = calculateHash(fileBody ?? '');
  return {
    metadata: {
      ...pathData,
      ...fileContentData,
      ...fileNameData,
    },
    hash,
  };
}
