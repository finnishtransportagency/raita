import { S3 } from "aws-sdk";
import { ISpecificationAdapterInterface } from "../types/portSpecification";

export class S3ConfigRepository implements ISpecificationAdapterInterface {
  #s3: S3;
  #configurationBucket: string;
  #configurationFile: string;

  constructor({
    configurationBucket,
    configurationFile,
    apiVersion,
  }: {
    configurationBucket: string;
    configurationFile: string;
    apiVersion?: string;
  }) {
    this.#s3 = new S3({ apiVersion: apiVersion ?? "2006-03-01" });
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
      throw new Error("Empty specification.");
    }
  };

  getFile = async (): Promise<void> => {};
}
