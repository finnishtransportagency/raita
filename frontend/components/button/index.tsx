import { clsx } from 'clsx';
import { SyntheticEvent } from 'react';

import css from './button.module.css';

const style = {
  base: ['px-4', 'py-2', 'bg-primary', 'text-white', 'rounded-full'].join(' '),
  primary: ['text-white', 'bg-blue-500'].join(' '),
  secondary: ['border', 'border-gray-400'].join(' '),
  sm: ['text-xs'].join(' '),
  md: [].join(' '),
};

const Button = ({
  label,
  type = 'primary',
  size = 'md',
  onClick,
  disabled,
}: Props) => {
  return (
    <button
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
