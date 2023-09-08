import { useTranslation } from 'next-i18next';
import { useEffect, useRef } from 'react';
import Select, { SelectInstance } from 'react-select';

import { clsx } from 'clsx';

import css from './multi-choice.module.css';

export function MultiChoice(props: Props) {
  const { t } = useTranslation(['common']);
  const ref = useRef<SelectInstance<Item>>(null);

  const { items, onChange, resetFilters } = props;

  useEffect(() => {
    if (ref.current && resetFilters) {
      ref.current.clearValue();
    }
  }, [resetFilters]);

  return (
    <div className={clsx(css.root)}>
      <Select
        id="multi-choice"
        isMulti={true}
        ref={ref}
        placeholder={t('common:no_choice')}
        onChange={newValue => {
          if (newValue && Array.isArray(newValue)) {
            onChange(newValue);
          } else {
            onChange([]);
          }
        }}
        className={clsx(css.select)}
        options={items.sort((a, b) => (a.value > b.value ? 1 : -1))}
      ></Select>
    </div>
  );
}

export default MultiChoice;

export type Props = {
  items: Item[];
  resetFilters: boolean;
  onChange: (options: Item[]) => void;
};

export type Item = {
  label: string;
  value: string;
};
