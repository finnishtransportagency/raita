/**
 * Compare two version "semver-ish" version strings: major.minor.patch
 * Return number like with a typical compare function
 * Positive: a is larger
 * Negative: a is smaller
 * 0: equal
 */
export function compareVersionStrings(a: string, b: string) {
  const [aMajor, aMinor, aPatch] = a.split('.');
  const [bMajor, bMinor, bPatch] = b.split('.');
  const majorDif = Number(aMajor) - Number(bMajor);
  if (majorDif) {
    return majorDif;
  }
  const minorDif = Number(aMinor) - Number(bMinor);
  if (minorDif) {
    return minorDif;
  }
  const patchDif = Number(aPatch) - Number(bPatch);
  if (patchDif) {
    return patchDif;
  }
  return 0;
}
