import { UploadPartCommandOutput } from '@aws-sdk/client-s3';
import {
  Prisma,
  ams_mittaus,
  ohl_mittaus,
  pi_mittaus,
  rc_mittaus,
  rp_mittaus,
  tg_mittaus,
  tsight_mittaus,
} from '@prisma/client';
import { MutationGenerate_Mittaus_CsvArgs } from '../../../apollo/__generated__/resolvers-types';
import { AdminLogSource } from '../../../utils/adminLog/types';

export enum FileGenerationProgressStatus {
  SUCCESS = 'SUCCESS',
  PENDING = 'PENDING',
  FAILED = 'FAILED',
}

export interface FileGenerationProgress {
  status: FileGenerationProgressStatus;
  progressPercentage: number;
  url?: string | undefined;
}

export type CsvGenerationEvent = {
  searchParameters: MutationGenerate_Mittaus_CsvArgs;
  progressKey: string;
  csvKey: string;
};

export type AdminLogExportEvent = {
  startTime: string;
  endTime: string;
  sources: AdminLogSource[];
  progressKey: string;
  resultFileKey: string;
};

export type CsvRow = { header: string; value: string }[];

export type MittausDbResult =
  | Partial<ams_mittaus>
  | Partial<ohl_mittaus>
  | Partial<pi_mittaus>
  | Partial<rc_mittaus>
  | Partial<rp_mittaus>
  | Partial<tg_mittaus>
  | Partial<tsight_mittaus>;

export type AnyMittausTableFindManyArgs =
  | Prisma.ams_mittausFindManyArgs
  | Prisma.ohl_mittausFindManyArgs
  | Prisma.pi_mittausFindManyArgs
  | Prisma.rc_mittausFindManyArgs
  | Prisma.rp_mittausFindManyArgs
  | Prisma.tg_mittausFindManyArgs
  | Prisma.tsight_mittausFindManyArgs;

export type MultipartUploadResultWithPartNumber = {
  uploadPartCommandOutput: UploadPartCommandOutput;
  partNumber: number;
};

export type MittausCombinationLogic =
  | 'MEERI_RATAOSOITE'
  | 'GEOVIITE_RATAOSOITE_ROUNDED';
