import { clsx } from 'clsx';
import { SyntheticEvent } from 'react';

import css from './button.module.css';

const Button = ({
  label,
  type = 'primary',
  size = 'md',
  onClick,
  disabled,
}: Props) => {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        css.root,
        size === 'sm' && css.buttonSmall,
        type === 'secondary' && css.secondary,
      )}
    >
      {label}
    </button>
  );
};

export default Button;

//

export type Props = {
  label: string;
  type?: 'primary' | 'secondary';
  size?: 'sm' | 'md';
  disabled?: boolean;
  onClick: (e: SyntheticEvent<HTMLButtonElement, Event>) => void;
};
