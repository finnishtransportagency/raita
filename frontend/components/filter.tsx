import { useState, useEffect, useMemo } from 'react';
import { assoc, dissoc, isEmpty, not, identity } from 'rambda';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { clsx } from 'clsx';

import { Button } from 'components';
import { App } from 'shared/types';
import { EMPTY_KEY } from 'shared/constants';

import css from './filter.module.css';

//

export function Filter(props: Props) {
  const { t } = useTranslation(['common', 'metadata']);

  console.log('filter', { props });

  const [state, setState] = useState<State>({
    keys: props.keys,
    filters: {},
  });

  const hasFilters = useMemo(
    () => not(isEmpty(state.filters)),
    [state.filters],
  );

  /** Ensure the given `onUpdate` callback is called when filters change */
  const invokeUpdate = () => props.onUpdate(state.filters);

  /** Use provided label transformation function if given, otherwise just use `id` */
  const labelFn = props.labelFn || identity;

  const setFilterValue = (key: string, value?: string) => {
    setState(prevState => ({
      ...prevState,
      filters: {
        ...prevState.filters,
        [key]: value ? value : prevState.filters[key],
      },
    }));
  };

  const renameFilter = (oldKey: string, newKey: string) => {
    setState(prevState => {
      if (newKey === EMPTY_KEY) return prevState;

      return {
        ...prevState,
        filters: Object.fromEntries(
          Object.entries(prevState.filters).map(([key, value]) => {
            if (key === oldKey) {
              return [newKey, value];
            }

            return [key, value];
          }),
        ),
      };
    });
  };

  const deleteFilter = (key: string) => {
    setState(prevState => ({
      ...prevState,
      filters: dissoc(key, prevState.filters),
    }));
  };

  const addFilter = () => {
    setState(prevState => ({
      ...prevState,
      filters: assoc(EMPTY_KEY, '', prevState.filters),
    }));
  };

  useEffect(() => {
    invokeUpdate();
  }, [state.filters]);

  return (
    <div className={css.root}>
      {!hasFilters && (
        <div className="border border-main-gray-50 bg-main-gray-10 px-4 py-2 mt-2">
          {t('common:filters_none_added')}
        </div>
      )}

      <ul className="space-y-3 mb-2">
        {Object.entries(state.filters).map(([filterKey, value], ix) => {
          const f = props.data[filterKey] as { type: string };
          const fieldType = props.data[filterKey] as { type: string };

          return (
            <li key={ix}>
              <article className="grid grid-cols-12 gap-3 items-center">
                {/**
                 * @todo Extract dropdowns out into their own component
                 * @todo Streamline classnames to fit visuals
                 */}
                <select
                  className={clsx('col-span-5', css.dropdown)}
                  value={filterKey}
                  onChange={e => renameFilter(filterKey, e.target.value)}
                >
                  <option value={EMPTY_KEY}>---</option>

                  {state.keys.map((key, keyIx) => (
                    <option key={keyIx} value={key}>
                      {t(labelFn(key))}
                    </option>
                  ))}
                </select>

                {/**
                 * @todo Extract into own component at a suitable time
                 * @todo Streamline classnames to fit visuals
                 * @todo Support field type `bool`
                 * @todo Support field type `long`
                 * @todo Support field type `text`
                 */}
                <input
                  className={clsx('col-span-5', css.input)}
                  // placeholder={t('common:value')}
                  placeholder={JSON.stringify(f)}
                  value={value}
                  onChange={e => setFilterValue(filterKey, e.target.value)}
                />

                <div className="col-span-2">
                  <Button
                    label={t('common:delete')}
                    type={'secondary'}
                    size="sm"
                    onClick={() => deleteFilter(filterKey)}
                  />
                </div>
              </article>
            </li>
          );
        })}
      </ul>

      <Button
        label={t('common:add_filter')}
        size="sm"
        onClick={() => addFilter()}
      />
    </div>
  );
}

export default Filter;

//

export type Props = {
  keys: string[];
  data: Record<string, Field | { [k: string]: string }>;
  onUpdate: (fs: Record<string, string>) => void;
  labelFn?: (label: string) => string;
};

//

export type StaticProps = {
  locale: App.Locales;
};

type FilterItem = {
  key: string;
  value: string;
};

type State = {
  keys: string[];
  data?: Record<string, Field>;
  filters: Record<string, string>;
};

type Field =
  | { type: 'date'; format?: string }
  | { type: 'long' }
  | { type: 'text' }
  | { type: 'bool' };
