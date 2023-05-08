import { useEffect, useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { format as formatDate } from 'date-fns/fp';

import { Button } from 'components';

import css from './daterange.module.css';
import { Range } from 'shared/types';
import { DATE_FMT } from 'shared/constants';
import { assoc } from 'rambda';
import { useTranslation } from 'next-i18next';

export function DateRange(props: Props) {
  const { t } = useTranslation(['common']);

  const { range, format, disabled = false, onUpdate } = props;

  const [state, setState] = useState({
    start: range?.start,
    end: range?.end,
  });

  //

  /**
   * @todo Convert this into a `{ start, end }` object instead
   */
  const rangeValues = useMemo(() => {
    const r = [
      state.start ? formatDate(DATE_FMT, state.start) : '',
      state.end ? formatDate(DATE_FMT, state.end) : '',
    ];

    return r;
  }, [state.start, state.end]);

  //

  useEffect(() => {
    onUpdate && onUpdate(state);
  }, [state]);

  return (
    <>
      <div className={clsx(css.root)}>
        <div className={clsx(css.group)}>
          <input
            {...{ disabled }}
            type={'date'}
            value={rangeValues[0]}
            className={clsx(css.input)}
            onChange={e => {
              setState(assoc('start', new Date(e.target.value)));
            }}
          />

          <Button
            {...{ disabled }}
            label={t('common:clear')}
            type={'secondary'}
            size={'sm'}
            onClick={() => setState(assoc('start', undefined))}
          />
        </div>

        <div className={clsx(css.group)}>
          <input
            {...{ disabled }}
            type={'date'}
            value={rangeValues[1]}
            className={clsx(css.input)}
            onChange={e => {
              const selectedDate = new Date(e.target.value);
              selectedDate.setHours(23, 59, 59);
              setState(assoc('end', selectedDate));
            }}
          />

          <Button
            {...{ disabled }}
            label={t('common:clear')}
            type={'secondary'}
            size={'sm'}
            onClick={() => setState(assoc('end', undefined))}
          />
        </div>
      </div>
    </>
  );
}

export default DateRange;

//

export type Props = {
  range?: Range<Date>;
  format?: Range<string>;
  disabled?: boolean;
  onUpdate: (range: Range<Date>) => void;
};
