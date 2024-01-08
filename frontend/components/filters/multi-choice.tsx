import { useTranslation } from 'next-i18next';
import { ChangeEvent, useEffect, useRef, useState } from 'react';

import { clsx } from 'clsx';

import css from './multi-choice.module.css';

export function MultiChoice(props: Props) {
  const { t } = useTranslation(['common']);
  const ref = useRef<HTMLSelectElement>(null);
  const [searchValue, setSearchValue] = useState('');

  const { items, onChange, resetFilters, label, inputId } = props;

  useEffect(() => {
    if (ref.current && resetFilters) {
      ref.current.value = '';
      setSearchValue('');
    }
  }, [resetFilters]);

  return (
    <div>
      <label className="block text-lg mb-2" htmlFor={`${inputId}-multi-choice`}>
        {label}
      </label>
      <input
        type="text"
        className={clsx(css.search)}
        value={searchValue}
        onChange={e => setSearchValue(e.target.value.toLocaleLowerCase())}
        placeholder={t('common:filter_options') || ''}
        aria-label={t('common:filter_options') || ''}
      />
      <select
        id={`${inputId}-multi-choice`}
        multiple={true}
        ref={ref}
        onChange={onChange}
        className={clsx(css.select)}
      >
        {searchValue === '' && (
          <option id="empty" value="">
            {t('common:no_choice')}
          </option>
        )}
        {items
          .filter(item => item.key.toLocaleLowerCase().includes(searchValue))
          .sort((a, b) => (a.value > b.value ? 1 : -1))
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
  label: string;
  inputId: string;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
};

export type Item = {
  key: string;
  value: string;
};
