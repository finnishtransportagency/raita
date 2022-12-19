import { exportForTesting } from '../handleInspectionFileEvent';
import { spec } from './extractionSpec';
const { parseFileMetadata } = exportForTesting;
import { testKeyData, simpleTestFile } from './testUtils';

/**
 * A simple starter test as a base for writing parser unit tests
 * and other backend tests.
 */

describe('Parser', () => {
  it('Parses simple txt-file', async () => {
    // const parseResults = await parseFileMetadata({
    //   keyData: testKeyData,
    //   file: simpleTestFile,
    //   spec,
    // });
    // expect(parseResults.metadata).toHaveProperty(
    //   'source_system',
    //   'SystemAlpha',
    // );
  });
});
