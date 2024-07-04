import { ISpecificationPortInterface } from '../types/portSpecification';
import { IFileInterface } from '../types/portFile';
import ConfigPort from './configPort';
import { S3FileRepository } from '../adapters/s3FileRepository';
import { IMetadataParserConfig } from '../lambdas/dataProcess/handleInspectionFileEvent/handleInspectionFileEvent';

class Backend {
  constructor(
    public specs: ISpecificationPortInterface,
    public files: IFileInterface,
  ) {}
}

// NOTE: Breaking the pattern here, using S3File repository directly, not port
export default class BackendFacade {
  static getBackend = ({
    configurationBucket,
    configurationFile,
  }: IMetadataParserConfig) => {
    return new Backend(
      new ConfigPort({ backend: 's3', configurationBucket, configurationFile }),
      new S3FileRepository(),
    );
  };
}
