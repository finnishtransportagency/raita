export const prefix = (p: string, x: string) => [p, x].join('');

/**
 * Basic no-op, shorthand for getting an undefined value.
 */
export function noop(...args: any[]) {}
export { noop as toUndefined };

export const sizeformatter = (size: number | undefined, decimalPlaces = 2) => {
  if (size) {
    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    let unit = 0;

    while (size >= 1024) {
      size /= 1024;
      unit += 1;
    }

    return `${size.toFixed(decimalPlaces)} ${units[unit]}`;
  }
};

export const takeOptionValues = (fs: HTMLCollectionOf<HTMLOptionElement>) =>
  Array.from(fs, opt => opt.value as string).filter(Boolean);
