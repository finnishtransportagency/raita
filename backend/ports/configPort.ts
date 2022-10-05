import { S3ConfigRepository } from '../adapters/s3ConfigRepository';
import {
  ISpecificationAdapterInterface,
  ISpecificationPortInterface,
} from '../types/portSpecification';
import { ExtractionSpec, IExtractionSpec } from '../types';

export type IConfigBackend = {
  backend: 's3';
  configurationFile: string;
  configurationBucket: string;
};

export default class ConfigPort implements ISpecificationPortInterface {
  #backend: ISpecificationAdapterInterface;

  constructor({
    backend,
    configurationBucket,
    configurationFile,
  }: IConfigBackend) {
    const backends: Record<
      IConfigBackend['backend'],
      () => ISpecificationAdapterInterface
    > = {
      s3: () =>
        new S3ConfigRepository({
          configurationFile,
          configurationBucket,
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
