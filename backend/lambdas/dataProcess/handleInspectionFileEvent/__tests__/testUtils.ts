import { IFileResult } from '../../../../types';
import { KeyData } from '../../../utils';

export const testKeyData: KeyData = {
  path: [
    'Meeri',
    '2000',
    'TestCampaign',
    '20000101',
    'testzip',
    '1',
    'TestTrackPart',
    'TestTrackId',
    '2000',
    'LIDAR',
    '20000101',
    'LidarTest',
    'testfile.txt',
  ],
  rootFolder: 'Meeri',
  fileName: 'testfile.txt',
  fileBaseName: 'testfile',
  fileSuffix: 'txt',
  keyWithoutSuffix:
    'Meeri/2000/TestCampaign/20000101/testzip/1/TestTrackPart/TestTrackId/2000/LIDAR/20000101/LidarTest/testfile',
};

export const simpleTestFile: IFileResult = {
  fileBody: 'I am a very simple file, I do not have any target data in me',
  contentType: 'text/plain',
  tags: {
    ZipTimeStamp: new Date().toISOString(),
    ZipTimeStampType: 'zipLastModified',
    ZipFileName: 'parent.zip',
  },
};
