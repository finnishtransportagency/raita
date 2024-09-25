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
        type === 'tertiary' && css.tertiary,
      )}
    >
      {label}
    </button>
  );
};

export default Button;

//

export type Props = {
  label: any;
  type?: 'primary' | 'secondary' | 'tertiary';
  size?: 'sm' | 'md';
  disabled?: boolean;
  onClick: (e: SyntheticEvent<HTMLButtonElement, Event>) => void;
};
