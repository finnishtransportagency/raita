import { clsx } from 'clsx';
import { useTranslation } from 'next-i18next';

import { Entry, EntryType, FieldTypeT } from './selector';

import css from './filter-control.module.css';

const FilterControl = (props: Props) => {
  const { t } = useTranslation(['common', 'metadata']);

  switch (props.type) {
    case 'Boolean':
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
    case 'DateTimeIntervalInput':
      // date only makes sense as range because it is stored as exact timestamp
      return (
        <div className="grid grid-cols-3 gap-2 w-full">
          <select
            aria-label={t('common:rel_type')}
            className={clsx(css.root, 'input')}
            value={props.entry.rel || 'gte'}
            onChange={e => {
              props.onUpdate(
                props.index,
                props.entry.field,
                props.entry.value,
                e.target.value,
                props.type,
              );
            }}
          >
            <option value="gte">{t('common:relation_gte')}</option>
            <option value="lte">{t('common:relation_lte')}</option>
          </select>
          <input
            className={clsx(
              css.root,
              'input',
              'input--date',
              'flex-grow',
              'col-span-2',
            )}
            type="date"
            defaultValue={props.entry.value as string}
            onChange={e =>
              props.onUpdate(
                props.index,
                props.entry.field,
                new Date(e.target.value).toISOString(),
                props.entry.rel || 'gte',
                props.type,
              )
            }
          />
        </div>
      );
    case 'IntIntervalInput':
    case 'FloatIntervalInput':
      return (
        <div className="grid grid-cols-3 gap-2">
          <select
            aria-label={t('common:rel_type')}
            className={clsx(css.root, 'input')}
            value={props.entry.rel || 'gte'}
            onChange={e => {
              props.onUpdate(
                props.index,
                props.entry.field,
                props.entry.value,
                e.target.value,
                props.type,
              );
            }}
          >
            <option value="gte">{t('common:relation_gte')}</option>
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
                props.entry.rel || 'gte',
                props.type,
              )
            }
          />
        </div>
      );
    case 'Int':
    case 'String':
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
              props.type,
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
    type?: FieldTypeT,
  ) => void;
};
