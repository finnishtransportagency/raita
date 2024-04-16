import { integer } from '@opensearch-project/opensearch/api/types';

//todo all db fields
export type Raportti = {
  key: string | null;
  file_name: string | null;
  status: string | null;
  chunks_to_process: number | null;
  events: string | null;
};
