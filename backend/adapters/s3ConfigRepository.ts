import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { ISpecificationAdapterInterface } from '../types/portSpecification';

export class S3ConfigRepository implements ISpecificationAdapterInterface {
  #s3: S3Client;
  #configurationBucket: string;
  #configurationFile: string;

  constructor({
    configurationBucket,
    configurationFile,
  }: {
    configurationBucket: string;
    configurationFile: string;
  }) {
    this.#s3 = new S3Client();
    this.#configurationBucket = configurationBucket;
    this.#configurationFile = configurationFile;
  }

  getSpecification = async (): Promise<string> => {
    const specJSONDoc = await this.#s3.send(
      new GetObjectCommand({
        Bucket: this.#configurationBucket,
        Key: this.#configurationFile,
      }),
    );
    const specJSON = await specJSONDoc.Body?.transformToString();
    if (specJSON) {
      return specJSON;
    } else {
      throw new Error('Empty specification.');
    }
  };

  getFile = async (): Promise<void> => {};
}
