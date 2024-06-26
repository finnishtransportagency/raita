import { render } from '@testing-library/react';

import LatestInspectionDate from '../index';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MockedProvider } from '@apollo/client/testing';

test('LatestInspectionDate', () => {
  const queryClient = new QueryClient();

  render(
    <QueryClientProvider client={queryClient}>
      <MockedProvider>
        <LatestInspectionDate />
      </MockedProvider>
    </QueryClientProvider>,
  );
});
