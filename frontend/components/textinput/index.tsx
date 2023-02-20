import { clsx } from 'clsx';
import React from 'react';

import css from './textinput.module.css';

export function TextInput(props: Props) {
  const { value, placeholder, onUpdate } = props;
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate(event.target.value);
  }

  return <input className={clsx(css.root)} {...{ value, placeholder, onChange: handleChange }} />;
}

export default TextInput;

//

export type Props = {
  onUpdate: (value: string) => void;
  value?: string;
  placeholder?: string;
};
