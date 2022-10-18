import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import { webClient } from 'shared/rest';
import { Rest } from 'shared/types';

/**
 *
 * @returns
 */
export function useFieldQuery() {
  return useQuery(['fields'], () =>
    webClient.get<Rest.Fields>('/fields').then(x => x.data),
  );
}

export function useReportState(): [
  ReportState,
  Dispatch<SetStateAction<ReportState>>,
] {
  const [state, setState] = useState<ReportState>({
    paging: { size: 10, offset: 0 },
  });

  return [state, setState];
}

export type ReportState = {
  paging: {
    size: number;
    offset: number;
  };
};

//
