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
   * Sort by which key to determine index
   */
  orderBy: 'id';
  /**
   * For admin logging
   */
  invocationId: string;
};

/**
 * Check is lat long flipped. Check only first row having non null coords and assume all are flipped if any.
 */
export async function isLatLongFlipped(mittausRows: any[]): Promise<boolean> {
  return !!mittausRows.find(mittaus => mittaus.lat && mittaus.lat < 40);
}
