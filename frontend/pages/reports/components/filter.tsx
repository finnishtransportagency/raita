import { Button } from 'components';
import { useState, useEffect } from 'react';
import { assoc, dissoc, fromPairs, map, pipe, toPairs } from 'rambda';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

import css from './filter.module.css';
import { App } from 'shared/types';

/** Placeholder value for an empty filter */
const EMPTY_KEY = '__EMPTY__' as const;

export function Filter(props: Props) {
  const { t } = useTranslation(['common']);

  const [state, setState] = useState<State>({
    keys: props.keys,
    filters: { system: '123' },
  });

  /**
   * Ensure the given `onUpdate` callback is called when filters change
   */
  const invokeUpdate = () => props.onUpdate(state.filters);

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
      <ul className="space-y-3 mb-2">
        {Object.entries(state.filters).map(([filterKey, value], ix) => (
          <li key={ix}>
            <article className="grid grid-cols-12 gap-3 items-center">
              {/**
               * @todo Extract dropdowns out into their own component
               * @todo Streamline classnames to fit visuals
               */}
              <select
                className="col-span-5 border-2 border-main-gray-50 px-2 py-1 rounded"
                value={filterKey}
                onChange={e => renameFilter(filterKey, e.target.value)}
              >
                <option value={EMPTY_KEY}>---</option>

                {state.keys.map((key, keyIx) => (
                  <option key={keyIx} value={key}>
                    {key}
                  </option>
                ))}
              </select>

              {/**
               * @todo Extract into own component at a suitable time
               * @todo Streamline classnames to fit visuals
               */}
              <input
                className="col-span-5 border-2 border-main-gray-50 px-2 py-1 rounded"
                placeholder={t('common:value')}
                value={value}
                onChange={e => setFilterValue(filterKey, e.target.value)}
              />

              <div className="col-span-2">
                <Button
                  label={t('common:delete')}
                  size="sm"
                  onClick={() => deleteFilter(filterKey)}
                />
              </div>
            </article>
          </li>
        ))}
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
  onUpdate: (fs: Record<string, string>) => void;
};

//

/**
 * @todo Check if this needs attention, as `getStaticProps` is discarded
 *       when only doing `next export`
 */
export async function getStaticProps(props: StaticProps) {
  const { locale } = props;

  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}

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
  filters: Record<string, string>;
};
