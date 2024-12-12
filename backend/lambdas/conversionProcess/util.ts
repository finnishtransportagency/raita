export type ConversionMessage = {
  id: number;
  system: string | null;
  key: string;
  /**
   * how many mittaus entries to handle in one invocation
   */
  batchSize: number;
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
export function isLatLongFlipped(mittausRows: any[]): boolean {
  return !!mittausRows.find(
    mittaus =>
      mittaus.lat &&
      mittaus.long &&
      isFlippedFinlandCoords(mittaus.lat, mittaus.long),
  );
}

// Numeric coords that are not both undefined/zero and not finlands coords or flipped finbland coords
export function isNonsenseCoords(mittausRows: any[]): boolean {
  return !!mittausRows.find(
    mittaus =>
      (mittaus.lat && !mittaus.long) ||
      (!mittaus.lat && mittaus.long) ||
      (mittaus.lat &&
        mittaus.long &&
        !isFinlandCoords(mittaus.lat, mittaus.long) &&
        !isFlippedFinlandCoords(mittaus.lat, mittaus.long)),
  );
}
