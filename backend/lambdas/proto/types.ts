export type ExternalDataMessage = {
  metadata: { [key: string]: any };
  key: string;
  status: 'IMG_EXPORT' | 'FULLY_PARSED';
};
