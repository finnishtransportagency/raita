import { clsx } from 'clsx';
import { useTranslation } from 'next-i18next';

import { Entry, FieldTypeT } from './selector';

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
            props.onUpdate(props.index, props.entry.field, e.target.value)
          }
        />
      );
    case 'long':
    case 'float':
      return (
        <>
          <select
            className={clsx(css.root, 'input')}
            value={props.entry.rel || 'eq'}
            onChange={e =>
              props.onUpdate(
                props.index,
                props.entry.field,
                undefined,
                e.target.value,
              )
            }
          >
            <option value="eq">{t('common:relation_eq')}</option>
            <option value="gte">{t('common:relation_gte')}</option>
            <option value="lte">{t('common:relation_lte')}</option>
          </select>

          <input
            className={clsx(css.root, 'input', 'input--long', 'flex-grow')}
            type={'number'}
            defaultValue={props.entry.value as string}
            onChange={e =>
              props.onUpdate(props.index, props.entry.field, e.target.value)
            }
          />
        </>
      );
    case 'text':
      return (
        <input
          className={clsx(css.root, 'input', 'input--text', 'w-full')}
          type="text"
          defaultValue={props.entry.value as string}
          onChange={e =>
            props.onUpdate(props.index, props.entry.field, e.target.value)
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
    value?: string | boolean,
    rel?: string,
  ) => void;
};
