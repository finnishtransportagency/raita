import { useTranslation } from 'next-i18next';
import { ChangeEvent, useEffect, useRef } from 'react';

import { clsx } from 'clsx';

import css from './multi-choice.module.css';

export function MultiChoice(props: Props) {
  const { t } = useTranslation(['common']);
  const ref = useRef<HTMLSelectElement>(null);

  const { items, onChange, resetFilters } = props;

  useEffect(() => {
    if (ref.current && resetFilters) {
      ref.current.value = '';
    }
  }, [resetFilters])

  return (
    <div className={clsx(css.root)}>
      <select
        id='multi-choice'
        multiple={true}
        ref={ref}
        onChange={onChange}
        className={clsx(css.select)}
      >
        <option id='empty' value="">{t('common:no_choice')}</option>
        {items.sort((a, b) => a.value > b.value ? 1 : -1)
        .map((it, ix) => {
          return (
            <option key={ix} value={it.value}>
              {it.key}
            </option>
          );
        })}
      </select>
    </div>
  );
}

export default MultiChoice;

//

export type Props = {
  items: Item[];
  resetFilters: boolean;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
};

export type Item = {
  key: string;
  value: string;
};
