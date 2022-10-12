import { clsx } from 'clsx';

const Dropdown = ({ label, items, multiple }: Props) => {
  return (
    <div className="block">
      {label && <label className="block">{label}</label>}

      <select
        multiple={multiple}
        className={clsx(
          'block w-full border border-gray-500',

          // Add padding if this dropdown is single-select
          !multiple && 'p-2',
        )}
      >
        <option className="p-2">Value 1</option>
      </select>
    </div>
  );
};

export default Dropdown;

//

export type Props = {
  label?: string;
  items: { key: string; value: string }[];
  multiple?: boolean;
};
