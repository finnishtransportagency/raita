import { ISpecificationPortInterface } from "../types/portSpecification";
import { IFileInterface } from "../types/portFile";
import { IMetadataStorageInterface } from "../types/portDataStorage";
import ConfigPort from "./configPort";
import MetadataPort from "./metadataPort";
import { S3FileRepository } from "../adapters/s3FileRepository";

class Backend {
  constructor(
    public specs: ISpecificationPortInterface,
    public files: IFileInterface,
    public metadataStorage: IMetadataStorageInterface
  ) {}
}

// NOTE: Breaking the pattern here, using S3File repository directly, not port
export default class BackendFacade {
  static getBackend = () => {
    return new Backend(
      new ConfigPort({ backend: "s3" }),
      new S3FileRepository(),
      new MetadataPort({ storageBackend: "openSearch" })
    );
  };
}
