import { S3ConfigRepository } from '../adapters/s3ConfigRepository';
import {
  ISpecificationAdapterInterface,
  ISpecificationPortInterface,
} from '../types/portSpecification';
import { ExtractionSpec, IExtractionSpec } from '../types';
import getConfig from '../config';

export type IConfigBackend = 's3';

export default class ConfigPort implements ISpecificationPortInterface {
  #backend: ISpecificationAdapterInterface;

  constructor({ backend }: { backend: IConfigBackend }) {
    const config = getConfig();
    const backends: Record<
      IConfigBackend,
      () => ISpecificationAdapterInterface
    > = {
      s3: () =>
        new S3ConfigRepository({
          configurationFile: config.parserConfigurationFile,
          configurationBucket: config.parserConfigurationBucketName,
        }),
    };
    this.#backend = backends[backend]();
  }

  getSpecification = async (): Promise<IExtractionSpec> => {
    try {
      const specJSON = await this.#backend.getSpecification();
      return ExtractionSpec.parse(JSON.parse(specJSON));
    } catch (error) {
      throw new Error(`Parsing failed. Extraction spec failure: ${error}`);
    }
  };
}
