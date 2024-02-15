import { defaultProvider } from '@aws-sdk/credential-provider-node';
import { Client } from '@opensearch-project/opensearch';
import createAwsOpensearchConnector from 'aws-opensearch-connector';
import { Credentials, Config, ConfigurationOptions, AWSError, Token } from 'aws-sdk';
import { APIVersions } from 'aws-sdk/lib/config';
import { ConfigurationServicePlaceholders } from 'aws-sdk/lib/config_service_placeholders';
import {CredentialsOptions} from 'aws-sdk/lib/credentials';

export class RaitaOpenSearchClient {
  #client: Client;
  #openSearchDomain: string;
  #region: string;

  constructor({
    openSearchDomain,
    region,
  }: {
    openSearchDomain: string;
    region: string;
  }) {
    this.#openSearchDomain = openSearchDomain;
    this.#region = region;
  }

  #initClient = async () => {
    // TODO: Figure out defaultProvider usage
    const awsCredentials = await defaultProvider()();
    const connector = createAwsOpensearchConnector({
      credentials: awsCredentials,
      region: this.#region,
      getCredentials: function (
        cb: (
          err: AWSError | null,
          credentials: Credentials | CredentialsOptions | null,
        ) => void,
      ) {
        return cb(null, null);
      },
      loadFromPath: function (
        path: string,
      ): Config & ConfigurationServicePlaceholders & APIVersions {
        throw new Error('Function not implemented.');
      },
      update: function (
        options: ConfigurationOptions &
          ConfigurationServicePlaceholders &
          APIVersions & {
            [key: string]: any;
          },
      ): void {
        throw new Error('Function not implemented.');
      },
      getToken: function (
        callback: (err: AWSError | null, token: Token | null) => void,
      ): void {
        throw new Error('Function not implemented.');
      },
      getPromisesDependency: function (): void | PromiseConstructor {
        throw new Error('Function not implemented.');
      },
      setPromisesDependency: function (dep: any): void {
        throw new Error('Function not implemented.');
      },
    });
    const client = new Client({
      ...connector,
      node: `https://${this.#openSearchDomain}`,
    });
    this.#client = client;
    return this.#client;
  };

  public getClient = async (): Promise<Client> => {
    return this.#client ?? (await this.#initClient());
  };
}
