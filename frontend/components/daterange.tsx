import { useEffect, useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { format as formatDate } from 'date-fns/fp';
import { add, isValid } from 'date-fns';

import { Button } from 'components';

import css from './daterange.module.css';
import { Range } from 'shared/types';
import { DATE_FMT } from 'shared/constants';
import { assoc } from 'rambda';
import { useTranslation } from 'next-i18next';

export function DateRange(props: Props) {
  const { t } = useTranslation(['common']);

  const { range, format, disabled = false, onUpdate, resetDateRange } = props;

  const [state, setState] = useState({
    start: range?.start,
    end: range?.end,
  });

  /**
   * Assumes that param date is local time equivalent of UTC 00:00:00
   */
  function getEndOfDay(date: Date) {
    return add(date, { hours: 23, minutes: 59, seconds: 59 });
  }

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
    if (resetDateRange) {
      setState(assoc('start', undefined));
      setState(assoc('end', undefined));
    }
  }, [resetDateRange]);

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
              const newStartDate = new Date(e.target.value);
              if (!isValid(newStartDate)) {
                return;
              }
              if (rangeValues[1] && newStartDate > new Date(rangeValues[1])) {
                setState(assoc('end', undefined));
              }
              setState(assoc('start', newStartDate));
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
            min={rangeValues[0] ? rangeValues[0] : undefined}
            className={clsx(css.input)}
            onChange={e => {
              const endDate = new Date(e.target.value);
              if (!isValid(endDate)) {
                return;
              }
              const endOfDay = getEndOfDay(endDate);
              setState(assoc('end', endOfDay));
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
  resetDateRange: boolean;
  onUpdate: (range: Range<Date>) => void;
};
