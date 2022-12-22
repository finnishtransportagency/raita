import * as R from 'rambda';
import { useTranslation } from 'next-i18next';
import { useEffect, useMemo, useState } from 'react';
import { clsx } from 'clsx';

import { Button } from 'components';
import { EMPTY_KEY } from 'shared/constants';
import css from './selector.module.css';
import FilterControl from './filter-control';

//

export default function Selector(props: Props) {
  const { t } = useTranslation(['common', 'metadata']);

  const [state, setState] = useState<State>({
    fields: props.fields || {},
    filters: props.filters || [],
  });

  const fieldList = useMemo(
    () => Object.entries(state.fields || {}),
    [state.fields],
  );

  const filterList = useMemo(() => state.filters || [], [state.filters]);

  // #region Filter callbacks

  const addFilter = () =>
    setState(s =>
      R.assoc(
        'filters',
        R.append({ field: EMPTY_KEY, value: '', type: 'match' }, s.filters),
        s,
      ),
    );

  /**
   * @todo Clarify/cleanup
   */
  const updateFilter = (
    index: number,
    field?: string,
    value?: any,
    rel?: any,
    type?: EntryType,
  ) => {
    setState(s => {
      const queryType = !!rel && rel !== 'eq' ? type : 'match';

      /**
       * This mess right here is for creating an object with keys not being in the object if
       * they aren't defined.
       */
      const _field = [
        { field },
        value ? { value } : {},
        rel ? { rel } : {},
        { type: queryType },
      ].reduce((o, a) => Object.assign({}, o, a), {});

      return R.assoc(
        'filters',
        R.adjust<Entry>(index, x => Object.assign({}, x, _field), s.filters),
        s,
      );
    });
  };

  const updateF = (i: number, entry: Entry) => {};

  const removeFilter = (i: number) => {
    setState(s =>
      R.assoc(
        'filters',
        s.filters.filter((_, j) => i !== j),
        s,
      ),
    );
  };

  // #endregion

  const invokeUpdate = () => props.onChange && props.onChange(state.filters);

  useEffect(() => {
    invokeUpdate();
  }, [state.filters]);

  //

  return (
    <div className={clsx(css.root)}>
      {/* Filter component */}
      <fieldset>
        <ul className="divide-y-2">
          {filterList.map((f, ix) => {
            const ff = state.fields[f.field];

            return (
              <li key={ix}>
                <div className={clsx(css.filter)}>
                  <div className={clsx(css.filterKey)}>
                    <select
                      aria-label={f.field}
                      className={clsx('input', css.filterKeySelect)}
                      value={f.field}
                      onChange={e => {
                        updateFilter(ix, e.target.value, '', f.rel, f.type);
                      }}
                    >
                      <option value={EMPTY_KEY} aria-label={EMPTY_KEY}>
                        {EMPTY_KEY}
                      </option>

                      {fieldList.map(([k, v]) => (
                        <option key={k} value={k} aria-label={k}>
                          {t(`metadata:label_${k}`)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={clsx(css.filterValue)}>
                    {!!ff && (
                      <FilterControl
                        key={f.field}
                        type={ff.type}
                        entry={f}
                        index={ix}
                        onUpdate={updateFilter}
                      />
                    )}
                  </div>

                  <div className={clsx(css.filterRemove)}>
                    <Button
                      label={t('common:remove_filter')}
                      onClick={() => removeFilter(ix)}
                      size={'sm'}
                      type={'secondary'}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <footer className={clsx(css.filterFooter)}>
          <Button
            label={t('common:add_filter')}
            onClick={() => addFilter()}
            size={'sm'}
          />
        </footer>
      </fieldset>
    </div>
  );
}

//

export type Props = {
  fields: FieldDict;
  filters?: Entry[];
  onChange?: (filters: Entry[]) => void;
};

export type State = {
  filters: Entry[];
  fields: FieldDict;
};

//

export type Entry = {
  field: string;
  /**
   * Store all values as strings or booleans, e.g. as-is from the HTML element,
   * e.g. checkboxes = booleans, all the rest are strings,
   * parse them into more specific types when/if needed.
   */
  value?: string | boolean;
  /**
   * Optionally, allow to specify the kind of relation this field should be checked
   * against, usually used for numbers (EQ, GTE, LTE, etc)
   */
  rel?: ValueRel;
  type: EntryType;
};

export type EntryType = 'match' | 'range';

export type ValueRel = 'eq' | 'gt' | 'gte' | 'lt' | 'lte';

export type FieldDict = Record<string, FieldType>;

export type FieldT<T> = { type: T };

/** @todo Rename plx */
export type FieldTypeT =
  | 'date'
  | 'text'
  | 'long'
  | 'float'
  | 'bool'
  | 'boolean';

export type FieldType = FieldT<FieldTypeT>;
