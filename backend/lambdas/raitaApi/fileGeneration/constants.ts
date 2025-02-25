import { FileGenerationProgress, FileGenerationProgressStatus } from './types';

export const InitialProgressData: FileGenerationProgress = {
  status: FileGenerationProgressStatus.PENDING,
  progressPercentage: 0,
};

export const FailedProgressData: FileGenerationProgress = {
  status: FileGenerationProgressStatus.FAILED,
  progressPercentage: 0,
};

export const SuccessProgressData: FileGenerationProgress = {
  status: FileGenerationProgressStatus.SUCCESS,
  progressPercentage: 100,
};
