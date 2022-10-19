import { useEffect, useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { format } from 'date-fns/fp';

import { Button } from 'components';

import css from './daterange.module.css';
import { Range } from 'shared/types';
import { DATE_FMT } from 'shared/constants';
import { assoc } from 'rambda';
import { useTranslation } from 'next-i18next';

export function DateRange(props: Props) {
  const { t } = useTranslation(['common']);

  const { range, onUpdate } = props;

  const [state, setState] = useState({
    start: range?.start,
    end: range?.end,
  });

  //

  const rangeValues = useMemo(() => {
    const r = [
      state.start ? format(DATE_FMT, state.start) : void 0,
      state.end ? format(DATE_FMT, state.end) : void 0,
    ];

    return r;
  }, [state.start, state.end]);

  //

  useEffect(() => {
    onUpdate && onUpdate({ start: state.start, end: state.end });
  }, [state]);

  return (
    <>
      <div className={clsx(css.root)}>
        <div className={clsx(css.group)}>
          <input
            type={'date'}
            value={rangeValues[0]}
            className={clsx(css.input)}
            onChange={e => {
              setState(assoc('start', new Date(e.target.value)));
            }}
          />

          <Button
            label={t('common:clear')}
            type={'secondary'}
            size={'sm'}
            onClick={() => {}}
          />
        </div>

        <div className={clsx(css.group)}>
          <input
            type={'date'}
            value={rangeValues[1]}
            className={clsx(css.input)}
            onChange={e => setState(assoc('end', new Date(e.target.value)))}
          />

          <Button
            label={t('common:clear')}
            type={'secondary'}
            size={'sm'}
            onClick={() => {}}
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
  onUpdate: (range: Range<Date>) => void;
};
