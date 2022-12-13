import { clsx } from 'clsx';
import { useTranslation } from 'next-i18next';
import { SyntheticEvent } from 'react';

import css from './dropdown.module.css';

function Dropdown(props: Props) {
  const { t } = useTranslation(['common']);
  const { label, items, disabled, onChange, multiple } = props;

  return (
    <div className="block">
      {label && <label className="block">{label}</label>}

      <select
        {...{ multiple, disabled, onChange }}
        className={clsx(
          css.root,
          'block w-full border border-gray-500',

          // Add padding if this dropdown is single-select
          !multiple && 'p-2',
        )}
      >
        <option className="p-2" value="">
          {t('common:no_choice')}
        </option>
        {items.map((it, ix) => {
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

export default Dropdown;

//

export type Props = {
  label?: string;
  items: { key: string; value: string }[];
  multiple?: boolean;
  disabled?: boolean;
  onChange: (e: SyntheticEvent<HTMLSelectElement, Event>) => void;
};
