import { S3 } from 'aws-sdk';
import { ISpecificationAdapterInterface } from '../types/portSpecification';

export class S3ConfigRepository implements ISpecificationAdapterInterface {
  #s3: S3;
  #configurationBucket: string;
  #configurationFile: string;

  constructor({
    configurationBucket,
    configurationFile,
  }: {
    configurationBucket: string;
    configurationFile: string;
  }) {
    this.#s3 = new S3();
    this.#configurationBucket = configurationBucket;
    this.#configurationFile = configurationFile;
  }

  getSpecification = async (): Promise<string> => {
    const specJSONDoc = await this.#s3
      .getObject({
        Bucket: this.#configurationBucket,
        Key: this.#configurationFile,
      })
      .promise();
    const specJSON = specJSONDoc.Body?.toString();
    if (specJSON) {
      return specJSON;
    } else {
      throw new Error('Empty specification.');
    }
  };

  getFile = async (): Promise<void> => {};
}
