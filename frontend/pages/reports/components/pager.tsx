import { repeat } from 'rambda';
import { clsx } from 'clsx';

import css from './pager.module.css';

export function Pager(props: Props) {
  const { count, size, page, onGotoPage } = props;
  const currentPage = page + 1;

  const pages = Math.ceil(count / size);
  const pageList = repeat(0, pages).map((_, ix) => ({ page: ix + 1 }));

  return (
    <>
      <nav className={clsx(css.root)}>
        <ul className={clsx('flex items-center space-x-2', css.pager)}>
          {pageList.map((n, ix) => (
            <li
              key={ix}
              className={clsx(
                css.page,
                n.page === currentPage && css.pageCurrent,
              )}
            >
              <button
                className={clsx(css.pageButton)}
                onClick={() => onGotoPage && onGotoPage(n.page)}
              >
                {n.page}
              </button>
            </li>
          ))}
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
