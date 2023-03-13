import {
  PutObjectCommand,
  PutObjectCommandOutput,
  PutObjectRequest,
  S3Client,
} from '@aws-sdk/client-s3';
import { S3 } from 'aws-sdk';
import { failedProgressData } from './constants';

export async function uploadProgressData(
  progressData: CompressionProgress,
  bucket: string,
  key: string,
  s3Client: S3Client,
): Promise<void | PutObjectCommandOutput> {
  const params = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: JSON.stringify(progressData),
  });
  return s3Client.send(params);
}

export async function uploadDeHydratedToS3(
  bucket: string,
  key: string,
  s3Client: S3Client,
  payload: string,
) {
  const params = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: payload,
  });
  return s3Client.send(params);
}

export async function getJsonObjectFromS3(bucket: string, key: string, s3: S3) {
  const command = {
    Bucket: bucket,
    Key: key,
  };
  const data = await s3.getObject(command).promise();
  return data?.Body ? JSON.parse(data.Body.toString()) : null;
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

export async function updateProgressFailed(
  bucket: string,
  key: string,
  s3Client: S3Client,
) {
  return uploadProgressData(failedProgressData, bucket, key, s3Client);
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

export interface ZipRequestBody {
  keys: string[];
  pollingFileKey: string;
  dehydrated?: boolean | undefined;
}

export enum ProgressStatus {
  SUCCESS = 'SUCCESS',
  PENDING = 'PENDING',
  FAILED = 'FAILED',
}
