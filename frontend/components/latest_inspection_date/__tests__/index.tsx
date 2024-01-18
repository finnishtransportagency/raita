import { render } from '@testing-library/react';

import LatestInspectionDate from '../index';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

test('LatestInspectionDate', () => {
  const queryClient = new QueryClient();

  render(
    <QueryClientProvider client={queryClient}>
      <LatestInspectionDate />
    </QueryClientProvider>,
  );
});
