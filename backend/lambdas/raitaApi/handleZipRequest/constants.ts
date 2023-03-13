import { CompressionProgress, ProgressStatus } from './utils';

export const initialProgressData: CompressionProgress = {
  status: ProgressStatus.PENDING,
  progressPercentage: 0,
};

export const failedProgressData: CompressionProgress = {
  status: ProgressStatus.FAILED,
  progressPercentage: 0,
};

export const successProgressData: CompressionProgress = {
  status: ProgressStatus.SUCCESS,
  progressPercentage: 100,
};

export const invocationTypeByteLimit: number = 262143;
