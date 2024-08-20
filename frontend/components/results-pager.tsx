import { useTranslation } from 'next-i18next';
import { type ReactNode, type MouseEvent, useState } from 'react';

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

  const [inputPage, setInputPage] = useState(currentPage);

  const pageCount = ceil(itemCount / pageSize);

  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === pageCount;
  const isCurrentPage = inputPage === currentPage;
  const isCurrentPage = inputPage === currentPage;
  const hasPrevPage = currentPage > 1;
  const hasNextPage = currentPage < pageCount;

  const prevPage = hasPrevPage ? currentPage - 1 : 1;
  const nextPage = hasNextPage ? currentPage + 1 : pageCount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (inputPage > pageCount) {
      setInputPage(pageCount);
      gotoPage(pageCount);
    } else if (inputPage <= 0) {
      setInputPage(1);
      gotoPage(1);
    } else {
      gotoPage(inputPage);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (!isNaN(Number(newValue))) {
      setInputPage(Number(newValue));
    }
  };

  return (
    <nav className={css.root}>
      <ul className={css.itemList}>
        <li className={css.item}>
          <Button
            size="sm"
            type="secondary"
            disabled={isFirstPage}
            onClick={() => {
              gotoPage(1);
              setInputPage(1);
            }}
            label={t('common:first_page', { number: 1 })}
          />
        </li>
        <li className={css.item}>
          <Button
            size="sm"
            type="secondary"
            disabled={!hasPrevPage}
            onClick={() => {
              gotoPage(prevPage);
              setInputPage(prevPage);
            }}
            label={t('common:previous_page', { number: prevPage })}
          />
        </li>

        <li className={css.item}>
          <span className="flex ">
            <form onSubmit={handleSubmit} className="flex space-x-2">
              {isCurrentPage ? (
                <p>{t('common:page')} </p>
              ) : (
                <Button
                  size="sm"
                  type="secondary"
                  disabled={false}
                  onClick={handleSubmit}
                  label={t('common:to_page')}
                />
              )}

              <input
                type="text"
                value={inputPage}
                onChange={handleChange}
                className="max-w-[5ch] text-center border rounded-lg border-thin"
              ></input>
            </form>
          </span>
        </li>

        <li className={css.item}>
          <Button
            size="sm"
            type="secondary"
            disabled={!hasNextPage}
            onClick={() => {
              gotoPage(nextPage);
              setInputPage(nextPage);
            }}
            label={t('common:next_page', { number: nextPage })}
          />
        </li>
        <li className={css.item}>
          <Button
            size="sm"
            type="secondary"
            disabled={isLastPage}
            onClick={() => {
              gotoPage(pageCount);
              setInputPage(pageCount);
            }}
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
