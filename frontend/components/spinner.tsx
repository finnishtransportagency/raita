import clsx from 'clsx';
import css from './spinner.module.css';

export function Spinner(props: Props) {
  let { size, bottomMargin } = props;
  size = size ?? 12;
  const spinnerSize = `h-${size} w-${size}`
  bottomMargin = bottomMargin ?? 4;
  return (
    <div
      className={clsx(
        css.loader,
        `ease-linear rounded-full border-4 border-t-4 border-gray-200 ${spinnerSize} mb-${bottomMargin}`,
      )}
    ></div>
  );
}

export type Props = {
  size?: number;
  bottomMargin?: number;
};
