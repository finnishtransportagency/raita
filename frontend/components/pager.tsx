import * as R from 'rambda';
import { clsx } from 'clsx';

import css from './pager.module.css';
import { useTranslation } from 'next-i18next';
import { useMemo } from 'react';

export function Pager(props: Props) {
  const { count, size, page, onGotoPage } = props;
  const { t } = useTranslation(['common']);

  const currentPage = page + 1;
  const pages = Math.ceil(count / size) || 1;

  const pageList = useMemo(
    () => R.repeat(0, pages).map((_, ix) => ({ page: ix + 1 })),
    [pages],
  );

  return (
    <>
      <nav
        className={clsx(css.root)}
        role="navigation"
        aria-label={t<string>('common:pager_a11y_label')}
      >
        <ul className={clsx('flex items-center space-x-2', css.pager)}>
          {pageList.map(n => {
            return (
              <li
                key={`page-${n.page}`}
                className={clsx(
                  css.page,
                  n.page === currentPage && css.pageCurrent,
                )}
              >
                <button
                  {...{
                    className: css.pageButton,
                    onClick: () => onGotoPage && onGotoPage(n.page),
                    'aria-label': t<string>('common:pager_a11y_goto_page', {
                      page: n.page,
                    }),

                    // Use `undefined` as value to make this attribute not appear
                    // for the element instead of `false`
                    'aria-current': n.page === currentPage ? true : undefined,
                  }}
                >
                  {n.page}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

export default Pager;

//

export type Props = {
  count: number;
  /**
   * Page size
   */
  size: number;
  page: number;
  onGotoPage?: (n: number) => void;
};
