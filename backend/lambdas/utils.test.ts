import {
  getOriginalZipNameFromPath,
  getZipFileNameIndex,
  isCampaignOrMoreSpecificPath,
  isValidZipName,
  isZipParentPath,
  isZipPath,
} from './utils';

describe('isValidZipName', () => {
  test('success: valid name', () => {
    const name = 'TG_AMS_OHL_CW_TVSS_20230928_005 KONRP 1_Reports.zip';
    expect(isValidZipName(name)).toEqual(true);
  });
  test('success: valid name without suffix', () => {
    const name = 'TG_AMS_OHL_CW_TVSS_20230928_005 KONRP 1_Reports';
    expect(isValidZipName(name)).toEqual(true);
  });
  test('fail: year', () => {
    const name = '2025';
    expect(isValidZipName(name)).toEqual(false);
  });
  test('fail: date', () => {
    const name = '20250110';
    expect(isValidZipName(name)).toEqual(false);
  });
  test('fail: date', () => {
    const name = '20250110-11';
    expect(isValidZipName(name)).toEqual(false);
  });
  test('success: anything else', () => {
    const name = 'test';
    expect(isValidZipName(name)).toEqual(true);
  });
});

describe('getZipFileNameIndex', () => {
  test('success: index 4', () => {
    const path = ['Meeri', '2025', 'CAMPAIGN', '20250101', 'TEST_NAME'];
    expect(getZipFileNameIndex(path)).toEqual(4);
  });
  test('success: index 3', () => {
    const path = ['Meeri', '2025', 'CAMPAIGN', 'TEST_NAME'];
    expect(getZipFileNameIndex(path)).toEqual(3);
  });
  test('fail: short path', () => {
    const path = ['Meeri', '2025', 'TEST_NAME'];
    expect(() => getZipFileNameIndex(path)).toThrow();
  });
  test('fail: invalid zip name ', () => {
    const path = ['Meeri', '2025', 'CAMPAIGN', '20250101', '2025'];
    expect(() => getZipFileNameIndex(path)).toThrow();
  });
});
describe('isZipPath', () => {
  test('success: path length 5', () => {
    const path = ['Meeri', '2025', 'CAMPAIGN', '20250101', 'TEST_NAME'];
    expect(isZipPath(path)).toEqual(true);
  });
  test('success: path length 4', () => {
    const path = ['Meeri', '2025', 'CAMPAIGN', 'TEST_NAME'];
    expect(isZipPath(path)).toEqual(true);
  });
  test('fail: path length 3', () => {
    const path = ['Meeri', '2025', 'TEST_NAME'];
    expect(isZipPath(path)).toEqual(false);
  });
  test('fail: path length 6', () => {
    const path = ['Meeri', '2025', 'CAMPAIGN', '20250101', 'TEST', 'TEST_NAME'];
    expect(isZipPath(path)).toEqual(false);
  });
});
describe('isZipParentPath', () => {
  test('success: path length 4 ending in date', () => {
    const path = ['Meeri', '2025', 'CAMPAIGN', '20250101'];
    expect(isZipParentPath(path)).toEqual(true);
  });
  test('fail: path length 4 ending in zip name', () => {
    const path = ['Meeri', '2025', 'CAMPAIGN', 'TEST_NAME'];
    expect(isZipParentPath(path)).toEqual(false);
  });
  test('success: path length 3 ', () => {
    const path = ['Meeri', '2025', 'CAMPAIGN'];
    expect(isZipParentPath(path)).toEqual(true);
  });
  test('success: path length 2 ', () => {
    const path = ['Meeri', '2025'];
    expect(isZipParentPath(path)).toEqual(true);
  });
  test('success: path length 1', () => {
    const path = ['Meeri'];
    expect(isZipParentPath(path)).toEqual(true);
  });
  test('fail: path length 5', () => {
    const path = ['Meeri', '2025', 'CAMPAIGN', '20250101', 'TEST_NAME'];
    expect(isZipParentPath(path)).toEqual(false);
  });
});

describe('isCampaignOrMoreSpecificPath', () => {
  test('success: path length 4 ending in date', () => {
    const path = ['Meeri', '2025', 'CAMPAIGN', '20250101'];
    expect(isCampaignOrMoreSpecificPath(path)).toEqual(true);
  });
  test('success: path length 3', () => {
    const path = ['Meeri', '2025', 'CAMPAIGN'];
    expect(isCampaignOrMoreSpecificPath(path)).toEqual(true);
  });
  test('fail: path length 4 ending in not date', () => {
    const path = ['Meeri', '2025', 'CAMPAIGN', 'TEST_NAME'];
    expect(isCampaignOrMoreSpecificPath(path)).toEqual(false);
  });
  test('fail: path length 2', () => {
    const path = ['Meeri', '2025'];
    expect(isCampaignOrMoreSpecificPath(path)).toEqual(false);
  });
  test('fail: path length 5', () => {
    const path = ['Meeri', '2025', 'CAMPAIGN', '20250101', 'TEST_NAME'];
    expect(isCampaignOrMoreSpecificPath(path)).toEqual(false);
  });
});
describe('getOriginalZipNameFromPath', () => {
  test('success: path length 4 ending in zip name', () => {
    const path = ['Meeri', '2025', 'CAMPAIGN', 'TEST_NAME'];
    expect(getOriginalZipNameFromPath(path)).toEqual(
      'Meeri/2025/CAMPAIGN/TEST_NAME.zip',
    );
  });
  test('success: path length 5', () => {
    const path = ['Meeri', '2025', 'CAMPAIGN', '20250101', 'TEST_NAME'];
    expect(getOriginalZipNameFromPath(path)).toEqual(
      'Meeri/2025/CAMPAIGN/20250101/TEST_NAME.zip',
    );
  });
  test('fail: path length 4 ending in date', () => {
    const path = ['Meeri', '2025', 'CAMPAIGN', '20250101'];
    expect(() => getOriginalZipNameFromPath(path)).toThrow();
  });
  test('success: longer path at name position 5', () => {
    const path = [
      'Meeri',
      '2025',
      'CAMPAIGN',
      '20250101',
      'TEST_NAME',
      'a',
      'b',
      'c',
    ];
    expect(getOriginalZipNameFromPath(path)).toEqual(
      'Meeri/2025/CAMPAIGN/20250101/TEST_NAME.zip',
    );
  });
  test('success: longer path at name position 4', () => {
    const path = ['Meeri', '2025', 'CAMPAIGN', 'TEST_NAME', 'a', 'b', 'c'];
    expect(getOriginalZipNameFromPath(path)).toEqual(
      'Meeri/2025/CAMPAIGN/TEST_NAME.zip',
    );
  });
  test('fail: path length 3', () => {
    const path = ['Meeri', '2025', 'TEST_NOT_NAME'];
    expect(getOriginalZipNameFromPath(path)).toEqual('');
  });
});
