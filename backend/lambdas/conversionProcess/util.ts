export type ConversionMessage = {
  id: number;
  system: string | null;
  key: string;
  /**
   * Which index to start at
   */
  batchIndex: number;
  /**
   * how many batches of this raportti
   */
  batchCount: number;
  /**
   * Sort by which key to determine index
   */
  orderBy: 'id';
  /**
   * For admin logging
   */
  invocationId: string;

  /**
   * mittaus id to start at
   */
  startID: number;

  /**
   * mittaus id to stop at
   */
  endID: number;
};

const finlandGenerousMinLat = 55.0;
const finlandGenerousMaxLat = 75.0;
const finlandGenerousMinLong = 15.0;
const finlandGenerousMaxLong = 35.0;

function isFinlandLat(lat: number) {
  return finlandGenerousMinLat < lat && lat < finlandGenerousMaxLat;
}

function isFinlandLong(long: number) {
  return finlandGenerousMinLong < long && long < finlandGenerousMaxLong;
}

export function isFinlandCoords(lat: number, long: number): boolean {
  return isFinlandLat(lat) && isFinlandLong(long);
}

export function isFlippedFinlandCoords(lat: number, long: number): boolean {
  return isFinlandLat(long) && isFinlandLong(lat);
}


/**
 * Check is lat long flipped. Check only first row having non null coords and assume all are flipped if any.
 */
export function isLatLongFlipped(mittaus: any): boolean {
  return (
    !!mittaus.lat &&
    mittaus.long &&
    isFlippedFinlandCoords(mittaus.lat, mittaus.long)
  );
}

// Numeric coords that are not both undefined/zero and not Finnland coords or flipped Finnland coords
export function isNonsenseCoords(mittaus: any): boolean {
  return (
    !!(mittaus.lat && !mittaus.long) ||
    (!mittaus.lat && mittaus.long) ||
    (mittaus.lat &&
      mittaus.long &&
      !isFinlandCoords(mittaus.lat, mittaus.long) &&
      !isFlippedFinlandCoords(mittaus.lat, mittaus.long))
  );
}

