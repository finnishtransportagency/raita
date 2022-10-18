import { Button } from 'components';
import { useState, useEffect } from 'react';
import { assoc, dissoc } from 'rambda';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

import css from './filter.module.css';
import { App } from 'shared/types';

type FilterItem = {
  key: string;
  value: string;
};

type State = {
  keys: string[];
  filters: Record<string, string>;
};

/**
 * Placeholder value for an empty filter
 */
const EMPTY_KEY = '__EMPTY__' as const;

export function Filter(props: Props) {
  const { t } = useTranslation(['common']);

  const [state, setState] = useState<State>({
    keys: props.keys,
    filters: { system: '123' },
  });

  const invokeUpdate = () => props.onUpdate(state.filters);

  const setFilterValue = (k: string, v?: string) => {
    setState(s => ({
      ...s,
      filters: { ...s.filters, [k]: v ? v : s.filters[k] },
    }));
  };

  const renameFilter = (oldKey: string, k: string) => {
    setState(s => {
      if (k === EMPTY_KEY) return s;

      const as = Object.entries(s.filters).map(([key, value]) => {
        if (key === oldKey) {
          console.log('Found key;', { key, k });
          return [k, value];
        }

        return [key, value];
      });

      return { ...s, filters: Object.fromEntries(as) };
    });
  };

  const deleteFilter = (k: string) => {
    setState(s => ({ ...s, filters: dissoc(k, s.filters) }));
  };

  const addFilter = () => {
    setState(s => ({ ...s, filters: assoc(EMPTY_KEY, '', s.filters) }));
  };

  useEffect(() => {
    invokeUpdate();
  }, [state.filters]);

  return (
    <div className={css.root}>
      <ul className="space-y-3 mb-2">
        {Object.entries(state.filters).map(([f, v], ix) => {
          return (
            <li key={ix}>
              <article className="grid grid-cols-12 gap-3 items-center">
                <select
                  className="col-span-5 border-2 border-main-gray-50 px-2 py-1 rounded"
                  value={f}
                  onChange={e => renameFilter(f, e.target.value)}
                >
                  <option value={EMPTY_KEY}>---</option>
                  <hr />

                  {state.keys.map((k, ix) => (
                    <option key={ix} value={k}>
                      {k}
                    </option>
                  ))}
                </select>

                <input
                  className="col-span-5 border-2 border-main-gray-50 px-2 py-1 rounded"
                  placeholder="two"
                  value={v}
                  onChange={e => setFilterValue(f, e.target.value)}
                />

                <div className="col-span-2">
                  <Button
                    label={t('common:delete')}
                    size="sm"
                    onClick={() => deleteFilter(f)}
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
  onUpdate: (fs: Record<string, string>) => void;
};

//

export async function getStaticProps(props: StaticProps) {
  const { locale } = props;

  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}

export type StaticProps = {
  locale: App.Locales;
};
