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
