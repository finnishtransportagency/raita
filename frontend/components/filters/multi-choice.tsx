import { useTranslation } from 'next-i18next';
import { ChangeEvent, useRef } from 'react';

import { clsx } from 'clsx';

import css from './multi-choice.module.css';

export function MultiChoice(props: Props) {
  const { t } = useTranslation(['common']);
  const ref = useRef<HTMLSelectElement>(null);

  const { items, onChange } = props;

  return (
    <div className={clsx(css.root)}>
      <select
        multiple={true}
        ref={ref}
        onChange={onChange}
        className={clsx(css.select)}
      >
        <option value="">{t('common:no_choice')}</option>
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
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
};

export type Item = {
  key: string;
  value: string;
};
