import { useTranslation } from 'next-i18next';
import type { ReactNode, MouseEvent } from 'react';

import Button from './button';

import css from './results-pager.module.css';

const { ceil } = Math;

export function ResultsPager(props: Props) {
  const { t } = useTranslation(['common']);

  const {
    currentPage,
    itemCount,
    pageSize,
    onGotoPage: gotoPage = a => {}, // just a placeholder for now
  } = props;

  const pageCount = ceil(itemCount / pageSize);

  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === pageCount;
  const hasPrevPage = currentPage > 1;
  const hasNextPage = currentPage < pageCount;

  const prevPage = hasPrevPage ? currentPage - 1 : 1;
  const nextPage = hasNextPage ? currentPage + 1 : pageCount;

  return (
    <nav className={css.root}>
      <ul className={css.itemList}>
        <li className={css.item}>
          <Button
            size="sm"
            type="secondary"
            disabled={isFirstPage}
            onClick={() => gotoPage(1)}
            label={t('common:first_page', { number: 1 })}
          />
        </li>
        <li className={css.item}>
          <Button
            size="sm"
            type="secondary"
            disabled={!hasPrevPage}
            onClick={() => gotoPage(prevPage)}
            label={t('common:previous_page', { number: prevPage })}
          />
        </li>

        <li className={css.item}>
          <span className={css.itemLabel}>
            {t('common:page_number_item', { number: currentPage })}
          </span>
        </li>

        <li className={css.item}>
          <Button
            size="sm"
            type="secondary"
            disabled={!hasNextPage}
            onClick={() => gotoPage(nextPage)}
            label={t('common:next_page', { number: nextPage })}
          />
        </li>
        <li className={css.item}>
          <Button
            size="sm"
            type="secondary"
            disabled={isLastPage}
            onClick={() => gotoPage(pageCount)}
            label={t('common:last_page', { number: pageCount })}
          />
        </li>
      </ul>
    </nav>
  );
}

export default ResultsPager;

//

export type Props = {
  currentPage: number;
  itemCount: number;
  pageSize: number;
  onGotoPage?: (n: number) => void;
};

//

type Item = {
  label: string | ReactNode;
  onClick: <T = HTMLButtonElement>(e: MouseEvent<T, MouseEvent>) => void;
};
