import { clsx } from 'clsx';
import { SyntheticEvent } from 'react';

function Dropdown(props: Props) {
  const { label, items, disabled, onChange, multiple } = props;

  return (
    <div className="block">
      {label && <label className="block">{label}</label>}

      <select
        {...{ multiple, disabled, onChange }}
        className={clsx(
          'block w-full border border-gray-500',

          // Add padding if this dropdown is single-select
          !multiple && 'p-2',
        )}
      >
        <option className="p-2">Value 1</option>
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
