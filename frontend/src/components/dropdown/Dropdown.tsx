/**
 * @todo Rename to Select instead
 * @todo Combine select/select multiple with checkbox/radiobuttons?
 *
 * @param props
 * @returns
 */
export function Dropdown(props: Props) {
  const { caption, items, multiple = false } = props;

  return (
    <div className="input">
      <label className="input__label">{caption}</label>
      <select multiple={multiple}>
        {items.map((it, i) => (
          <option key={i} value={it.value}>
            {it.value}
          </option>
        ))}
      </select>
    </div>
  );
}

export default Dropdown;

//

export type Props = {
  caption: string;
  items: ListItem<string>[];
  multiple?: boolean;
};

type ListItem<T> = {
  key: string;
  value: T;
};
