import { clsx } from 'clsx';

import css from './textinput.module.css';

export function TextInput(props: Props) {
  const { value, placeholder } = props;

  return <input className={clsx(css.root)} {...{ value, placeholder }} />;
}

export default TextInput;

//

export type Props = {
  onUpdate: () => void;
  value?: string;
  placeholder?: string;
};
