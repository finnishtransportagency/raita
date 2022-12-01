import * as R from 'rambda';
import { useTranslation } from 'next-i18next';
import { useEffect, useMemo, useState } from 'react';
import { clsx } from 'clsx';

import { EMPTY_KEY } from 'shared/constants';

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
        R.append({ field: EMPTY_KEY, value: '' }, s.filters),
        s,
      ),
    );

  /** @todo Clarify/cleanup */
  const updateFilter = (i: number, k?: string, v?: any, r?: any) => {
    setState(s => {
      const _field = [
        { field: k },
        v ? { value: v } : {},
        r ? { rel: r } : {},
      ].reduce((o, a) => Object.assign({}, o, a), {});

      return R.assoc(
        'filters',
        R.adjust<Entry>(i, x => Object.assign({}, x, _field), s.filters),
        s,
      );
    });
  };

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
    <div>
      <fieldset className="border-2 border-red-500">
        <legend className="px-2 py-1 ml-2">Filters</legend>

        <ul className="divide-y-2">
          {filterList.map((f, ix) => {
            const ff = state.fields[f.field];

            const FilterControl = () => {
              switch (ff.type) {
                case 'bool':
                case 'boolean':
                  return (
                    <label className={clsx('input', 'input--bool')}>
                      <input
                        type="checkbox"
                        onChange={e =>
                          updateFilter(ix, f.field, e.target.checked)
                        }
                      />

                      {f.field}
                    </label>
                  );
                case 'date':
                  return (
                    <input
                      className={clsx('input', 'input--date', 'w-full')}
                      type="date"
                      defaultValue={f.value as string}
                      onChange={e => updateFilter(ix, f.field, e.target.value)}
                    />
                  );
                case 'long':
                case 'float':
                  return (
                    <>
                      <select
                        className={clsx('input')}
                        value={f.rel || 'eq'}
                        onChange={e =>
                          updateFilter(ix, f.field, undefined, e.target.value)
                        }
                      >
                        <option value="eq">{t('common:relation_eq')}</option>
                        <option value="gte">{t('common:relation_gte')}</option>
                        <option value="lte">{t('common:relation_lte')}</option>
                      </select>

                      <input
                        className={clsx('input', 'input--long')}
                        type={'number'}
                        defaultValue={f.value as string}
                        onChange={e =>
                          updateFilter(ix, f.field, e.target.value)
                        }
                      />
                    </>
                  );
                case 'text':
                  return (
                    <input
                      className={clsx('input', 'input--text', 'w-full')}
                      type="text"
                      defaultValue={f.value as string}
                      onChange={e => updateFilter(ix, f.field, e.target.value)}
                    />
                  );
                default:
                  return <div>default</div>;
              }
            };

            return (
              <li key={ix} className="border-2 px-2 py-1">
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-5">
                    <select
                      aria-label={f.field}
                      className={clsx('input')}
                      value={f.field}
                      onChange={e => {
                        updateFilter(ix, e.target.value, '');
                      }}
                    >
                      <option value={EMPTY_KEY} aria-label={EMPTY_KEY}>
                        {EMPTY_KEY}
                      </option>

                      {fieldList.map(([k, v]) => (
                        <option key={k} aria-label={k}>
                          {k}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-5">{!!ff && <FilterControl />}</div>

                  <div className="col-span-2 border-2 border-red-500">
                    <button
                      aria-label={t('common:remove_filter')}
                      className="input w-full"
                      onClick={() => removeFilter(ix)}
                    >
                      {t('common:remove_filter')}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <footer className="px-2 py-1 border-t-2">
          <button
            className={clsx('input')}
            onClick={() => addFilter()}
            aria-label={t('common:add_filter')}
          >
            {t('common:add_filter')}
          </button>
        </footer>
      </fieldset>

      <div className="grid grid-cols-2 text-xs">
        <pre>
          <code>{JSON.stringify(state.filters, null, 2)}</code>
        </pre>

        <pre>
          <code>{JSON.stringify(state.filters, null, 2)}</code>
        </pre>
      </div>
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
};

export type ValueRel = 'eq' | 'gte' | 'lte';

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
