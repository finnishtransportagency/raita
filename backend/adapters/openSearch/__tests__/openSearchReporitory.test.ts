import { RaitaOpenSearchClient } from '../../../clients/openSearchClient';
import { FileMetadataEntry } from '../../../types';
import { OpenSearchRepository } from '../openSearchRepository';
import { OpenSearchResponseParser } from '../openSearchResponseParser';

const getMockRepo = ({
  hashSearchResult,
  keySearchResult,
}: {
  hashSearchResult: any;
  keySearchResult: any;
}) => {
  const searchMock = (param: any) => {
    if (
      hashSearchResult &&
      param?.body?.query?.bool?.must[0]?.match['hash.keyword']
    ) {
      return Promise.resolve({
        body: {
          hits: {
            hits: hashSearchResult,
          },
        },
      });
    }
    if (
      keySearchResult &&
      param?.body?.query?.bool?.must[1]?.match['key.keyword']
    ) {
      return Promise.resolve({
        body: {
          hits: {
            hits: keySearchResult,
          },
        },
      });
    }
    return Promise.resolve({
      body: {
        hits: { hits: [] },
      },
    });
  };
  const mockOpensearchClient = {
    search: searchMock,
    update: jest.fn(),
    index: jest.fn(),
  };
  const mockOpenSearchClientWrapper = {
    getClient: () => mockOpensearchClient,
  };
  const responseParserMock = {};
  return {
    repo: new OpenSearchRepository({
      dataIndex: 'test',
      openSearchClient:
        mockOpenSearchClientWrapper as any as RaitaOpenSearchClient,
      responseParser: responseParserMock as any as OpenSearchResponseParser,
    }),
    client: mockOpensearchClient,
  };
};

describe('OpenSearchRepository.upsertDocument', () => {
  test('nothing found => insert', async () => {
    const entry: FileMetadataEntry = {
      file_name: 'test',
      key: 'path/test',
      size: 100,
      bucket_name: '',
      bucket_arn: '',
      metadata: {
        test: 'test',
        parsed_at_datetime: 'test',
        parser_version: '0.0.1',
      },
      hash: 'testHash',
      options: {
        skip_hash_check: false,
        require_newer_parser_version: false,
      },
    };
    const repo = getMockRepo({
      hashSearchResult: undefined,
      keySearchResult: undefined,
    });
    await repo.repo.upsertDocument(entry);
    expect(repo.client.index).toHaveBeenCalledTimes(1);
    expect(repo.client.update).toHaveBeenCalledTimes(0);
  });
  test('found by hash => do nothing', async () => {
    const entry: FileMetadataEntry = {
      file_name: 'test',
      key: 'path/test',
      size: 100,
      bucket_name: '',
      bucket_arn: '',
      metadata: {
        test: 'test',
        parsed_at_datetime: 'test',
        parser_version: '0.0.1',
      },
      hash: 'testHash',
      options: {
        skip_hash_check: false,
        require_newer_parser_version: false,
      },
    };
    const repo = getMockRepo({
      hashSearchResult: [
        {
          _source: { hash: 'testHash', key: 'path/test', metadata: {} },
        },
      ],
      keySearchResult: undefined,
    });
    await repo.repo.upsertDocument(entry);
    expect(repo.client.index).toHaveBeenCalledTimes(0);
    expect(repo.client.update).toHaveBeenCalledTimes(0);
  });
  test('multiple matches found by hash => throw', async () => {
    const entry: FileMetadataEntry = {
      file_name: 'test',
      key: 'path/test',
      size: 100,
      bucket_name: '',
      bucket_arn: '',
      metadata: {
        test: 'test',
        parsed_at_datetime: 'test',
        parser_version: '0.0.1',
      },
      hash: 'testHash',
      options: {
        skip_hash_check: false,
        require_newer_parser_version: false,
      },
    };
    const repo = getMockRepo({
      hashSearchResult: [
        {
          _source: { hash: 'testHash', key: 'path/test', metadata: {} },
        },
        {
          _source: { hash: 'testHash', key: 'path/test2', metadata: {} },
        },
      ],
      keySearchResult: undefined,
    });
    expect(() => repo.repo.upsertDocument(entry)).rejects.toBeTruthy();
  });
  test('found by hash, skip_hash_check=true => update', async () => {
    const entry: FileMetadataEntry = {
      file_name: 'test',
      key: 'path/test',
      size: 100,
      bucket_name: '',
      bucket_arn: '',
      metadata: {
        test: 'test',
        parsed_at_datetime: 'test',
        parser_version: '0.0.1',
      },
      hash: 'testHash',
      options: {
        skip_hash_check: true,
        require_newer_parser_version: false,
      },
    };
    const repo = getMockRepo({
      hashSearchResult: [
        {
          _source: { hash: 'testHash', key: 'path/test', metadata: {} },
        },
      ],
      keySearchResult: undefined,
    });
    await repo.repo.upsertDocument(entry);
    expect(repo.client.index).toHaveBeenCalledTimes(0);
    expect(repo.client.update).toHaveBeenCalledTimes(1);
  });
  test('found by hash but key differs, skip_hash_check=true => overwrite/update', async () => {
    const entry: FileMetadataEntry = {
      file_name: 'test',
      key: 'path/test',
      size: 100,
      bucket_name: '',
      bucket_arn: '',
      metadata: {
        test: 'test',
        parsed_at_datetime: 'test',
        parser_version: '0.0.1',
      },
      hash: 'testHash',
      options: {
        skip_hash_check: true,
        require_newer_parser_version: false,
      },
    };
    const repo = getMockRepo({
      hashSearchResult: [
        {
          _source: {
            hash: 'testHash',
            key: 'other/path/here',
            metadata: {},
          },
        },
      ],
      keySearchResult: undefined,
    });
    await repo.repo.upsertDocument(entry);
    expect(repo.client.index).toHaveBeenCalledTimes(0);
    expect(repo.client.update).toHaveBeenCalledTimes(1);
  });
  test('found by key => update', async () => {
    const entry: FileMetadataEntry = {
      file_name: 'test',
      key: 'path/test',
      size: 100,
      bucket_name: '',
      bucket_arn: '',
      metadata: {
        test: 'test',
        parsed_at_datetime: 'test',
        parser_version: '0.0.1',
      },
      hash: 'testHash',
      options: {
        skip_hash_check: false,
        require_newer_parser_version: false,
      },
    };
    const repo = getMockRepo({
      hashSearchResult: undefined,
      keySearchResult: [
        {
          _source: { hash: 'testHash', key: 'path/test', metadata: {} },
        },
      ],
    });
    await repo.repo.upsertDocument(entry);
    expect(repo.client.index).toHaveBeenCalledTimes(0);
    expect(repo.client.update).toHaveBeenCalledTimes(1);
  });
  test('found by key, versions are equal, require_newer_parser_version=true => do nothing', async () => {
    const entry: FileMetadataEntry = {
      file_name: 'test',
      key: 'path/test',
      size: 100,
      bucket_name: '',
      bucket_arn: '',
      metadata: {
        test: 'test',
        parsed_at_datetime: 'test',
        parser_version: '0.0.1',
      },
      hash: 'testHash',
      options: {
        skip_hash_check: false,
        require_newer_parser_version: true,
      },
    };
    const repo = getMockRepo({
      hashSearchResult: undefined,
      keySearchResult: [
        {
          _source: {
            hash: 'testHash',
            key: 'path/test',
            metadata: { parser_version: '0.0.1' },
          },
        },
      ],
    });
    await repo.repo.upsertDocument(entry);
    expect(repo.client.index).toHaveBeenCalledTimes(0);
    expect(repo.client.update).toHaveBeenCalledTimes(0);
  });
  test('found by hash, versions are equal, require_newer_parser_version=true => do nothing ', async () => {
    const entry: FileMetadataEntry = {
      file_name: 'test',
      key: 'path/test',
      size: 100,
      bucket_name: '',
      bucket_arn: '',
      metadata: {
        test: 'test',
        parsed_at_datetime: 'test',
        parser_version: '0.0.1',
      },
      hash: 'testHash',
      options: {
        skip_hash_check: true,
        require_newer_parser_version: true,
      },
    };
    const repo = getMockRepo({
      hashSearchResult: [
        {
          _source: {
            hash: 'testHash',
            key: 'path/test',
            metadata: { parser_version: '0.0.1' },
          },
        },
      ],
      keySearchResult: undefined,
    });
    await repo.repo.upsertDocument(entry);
    expect(repo.client.index).toHaveBeenCalledTimes(0);
    expect(repo.client.update).toHaveBeenCalledTimes(0);
  });
  test('found by hash, incoming version is newer, require_newer_parser_version=true => update', async () => {
    const entry: FileMetadataEntry = {
      file_name: 'test',
      key: 'path/test',
      size: 100,
      bucket_name: '',
      bucket_arn: '',
      metadata: {
        test: 'test',
        parsed_at_datetime: 'test',
        parser_version: '0.0.2',
      },
      hash: 'testHash',
      options: {
        skip_hash_check: true,
        require_newer_parser_version: true,
      },
    };
    const repo = getMockRepo({
      hashSearchResult: [
        {
          _source: {
            hash: 'testHash',
            key: 'path/test',
            metadata: { parser_version: '0.0.1' },
          },
        },
      ],
      keySearchResult: undefined,
    });
    await repo.repo.upsertDocument(entry);
    expect(repo.client.index).toHaveBeenCalledTimes(0);
    expect(repo.client.update).toHaveBeenCalledTimes(1);
  });
});
