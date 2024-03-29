import { clsx } from 'clsx';
import { InputHTMLAttributes, useEffect, useRef } from 'react';

import css from './textinput.module.css';

export function TextInput(
  props: Props & InputHTMLAttributes<HTMLInputElement>,
) {
  const { value, placeholder, onUpdate, resetSearchText, ...otherProps } =
    props;
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate(event.target.value);
  };

  useEffect(() => {
    if (resetSearchText && inputRef.current) {
      inputRef.current.value = '';
    }
  }, [resetSearchText]);

  return (
    <input
      className={clsx(css.root)}
      {...{ value, placeholder, onChange: handleChange }}
      {...otherProps}
    />
  );
}

export default TextInput;

//

export type Props = {
  onUpdate: (value: string) => void;
  value?: string;
  placeholder?: string;
  resetSearchText: boolean;
};
