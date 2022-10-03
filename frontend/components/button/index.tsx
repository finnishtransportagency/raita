import { clsx } from 'clsx';

const style = {
  base: ['px-4', 'py-2'].join(' '),
  primary: ['text-white', 'bg-blue-500'].join(' '),
  secondary: ['text-black', 'bg-gray-300', 'border', 'border-gray-400'].join(
    ' ',
  ),
  sm: ['text-xs'].join(' '),
  md: [].join(' '),
};

const Button = ({ label, type = 'primary', size = 'md' }: Props) => {
  return (
    <button className={clsx(style.base, style[type], style[size])}>
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
};
