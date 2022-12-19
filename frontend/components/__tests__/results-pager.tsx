import { render, fireEvent, logDOM, logRoles } from '@testing-library/react';

import ResultsPager from '../results-pager';

it('has a minimal working example', () => {
  const fn = jest.fn();

  const { container, getByRole } = render(
    <ResultsPager
      currentPage={1}
      itemCount={100}
      pageSize={10}
      onGotoPage={fn}
    />,
  );
});

describe('movement', () => {
  it('correctly moves to first/last/prev/next page', () => {
    const fn = jest.fn();

    const [pageMin, pageMax] = [1, 10];
    const curPage = 5;
    const { getByRole } = render(
      <ResultsPager
        currentPage={curPage}
        itemCount={100}
        pageSize={10}
        onGotoPage={fn}
      />,
    );

    fireEvent.click(getByRole('button', { name: /first_page/i }));
    fireEvent.click(getByRole('button', { name: /last_page/i }));
    fireEvent.click(getByRole('button', { name: /next_page/i }));
    fireEvent.click(getByRole('button', { name: /previous_page/i }));

    expect(fn.mock.calls[0][0]).toBe(pageMin);
    expect(fn.mock.calls[1][0]).toBe(pageMax);
    expect(fn.mock.calls[2][0]).toBe(curPage + 1);
    expect(fn.mock.calls[3][0]).toBe(curPage - 1);
  });

  it('will do nothing if going to first/prev or last/next on first/last page', () => {
    const fn = jest.fn();

    const { getByRole } = render(
      <ResultsPager
        onGotoPage={fn}
        currentPage={1}
        itemCount={10}
        pageSize={10}
      />,
    );

    fireEvent.click(getByRole('button', { name: /first_page/i }));
    fireEvent.click(getByRole('button', { name: /last_page/i }));
    fireEvent.click(getByRole('button', { name: /next_page/i }));
    fireEvent.click(getByRole('button', { name: /previous_page/i }));

    // Since we're on page 1/1, the `onGotoPage` function should never have been called
    expect(fn).not.toHaveBeenCalled();
  });
});
