import { compareVersionStrings } from '../compareVersionStrings';

describe('compareVersionStrings', () => {
  test('success: different values', async () => {
    const first = '1.0.0';
    const patchLarger = '1.0.1';
    const minorLarger = '1.1.0';
    const majorLarger = '2.0.0';
    expect(compareVersionStrings(first, first)).toEqual(0);
    expect(compareVersionStrings(first, patchLarger)).toBeLessThan(0);
    expect(compareVersionStrings(first, minorLarger)).toBeLessThan(0);
    expect(compareVersionStrings(first, majorLarger)).toBeLessThan(0);
    expect(compareVersionStrings(patchLarger, first)).toBeGreaterThan(0);
    expect(compareVersionStrings(minorLarger, first)).toBeGreaterThan(0);
    expect(compareVersionStrings(majorLarger, first)).toBeGreaterThan(0);
    expect(compareVersionStrings(minorLarger, patchLarger)).toBeGreaterThan(0);
    expect(compareVersionStrings(majorLarger, minorLarger)).toBeGreaterThan(0);
    expect(compareVersionStrings(first, first)).toEqual(0);
  });
});
