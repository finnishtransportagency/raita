import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { failedProgressData } from './constants';


export async function uploadProgressData(
  progressData: CompressionProgress,
  bucket: string,
  key: string,
  s3Client: S3Client
): Promise<void> {
  console.log('Uploads progress data: ' + progressData.status)
  const params = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: JSON.stringify(progressData),
  });
  const jee = await s3Client.send(params);
  console.log(jee);
}

export function shouldUpdateProgressData(
  progressPercentage: number,
  lastUpdate: number,
): boolean {
  const updateSteps = [25, 50, 75];
  return (
    updateSteps.includes(progressPercentage) && progressPercentage > lastUpdate
  );
}

export function updateProgressFailed(bucket: string, key: string, s3Client: S3Client) {
  uploadProgressData(failedProgressData, bucket, key, s3Client);
}

export function validateInputs(keys: string[], pollingFileKey: string) {
  if (!keys.length) throw new Error('No file keys to handle');
  if (!pollingFileKey.length)
    throw new Error('The key of the polling file cannot be empty');
}

export interface CompressionProgress {
  status: ProgressStatus;
  progressPercentage: number;
  url?: string | undefined;
}

export enum ProgressStatus {
  SUCCESS = 'SUCCESS',
  PENDING = 'PENDING',
  FAILED = 'FAILED',
}
