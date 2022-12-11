import { clsx } from 'clsx';
import { useTranslation } from 'next-i18next';

import { Entry, EntryType, FieldTypeT } from './selector';

import css from './filter-control.module.css';

const FilterControl = (props: Props) => {
  const { t } = useTranslation(['common', 'metadata']);

  switch (props.type) {
    case 'bool':
    case 'boolean':
      return (
        <label className={clsx(css.root, 'input', 'input--bool')}>
          <input
            type="checkbox"
            checked={props.entry.value as boolean}
            onChange={e =>
              props.onUpdate(props.index, props.entry.field, e.target.checked)
            }
          />

          {props.entry.field}
        </label>
      );
    case 'date':
      return (
        <input
          className={clsx(css.root, 'input', 'input--date', 'w-full')}
          type="date"
          defaultValue={props.entry.value as string}
          onChange={e =>
            props.onUpdate(
              props.index,
              props.entry.field,
              new Date(e.target.value),
              'eq',
              'match',
            )
          }
        />
      );
    case 'long':
    case 'float':
      return (
        <div className="grid grid-cols-3 gap-2">
          <select
            aria-label={t('common:rel_type')}
            className={clsx(css.root, 'input')}
            value={props.entry.rel || 'eq'}
            onChange={e => {
              const relType = e.target.value === 'eq' ? 'match' : 'range';

              props.onUpdate(
                props.index,
                props.entry.field,
                props.entry.value,
                e.target.value,
                relType,
              );
            }}
          >
            <option value="eq">{t('common:relation_eq')}</option>
            <option value="gt">{t('common:relation_gt')}</option>
            <option value="gte">{t('common:relation_gte')}</option>
            <option value="lt">{t('common:relation_lt')}</option>
            <option value="lte">{t('common:relation_lte')}</option>
          </select>

          <input
            className={clsx(
              css.root,
              'input',
              'input--long',
              'flex-grow',
              'col-span-2',
            )}
            type={'number'}
            defaultValue={props.entry.value as string}
            onChange={e =>
              props.onUpdate(
                props.index,
                props.entry.field,
                e.target.value,
                props.entry.rel,
                props.entry.type,
              )
            }
          />
        </div>
      );
    case 'text':
      return (
        <input
          className={clsx(css.root, 'input', 'input--text', 'w-full')}
          type="text"
          defaultValue={props.entry.value as string}
          onChange={e =>
            props.onUpdate(
              props.index,
              props.entry.field,
              e.target.value,
              'eq',
              'match',
            )
          }
        />
      );
    default:
      return <div>default</div>;
  }
};

export default FilterControl;

//

export type Props = {
  type: FieldTypeT;
  entry: Entry;
  index: number;
  onUpdate: (
    ix: number,
    field: string,
    value?: string | boolean | Date,
    rel?: string,
    entryType?: EntryType,
  ) => void;
};
