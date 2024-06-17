import { RaporttiInput } from 'shared/graphql/__generated__/graphql';
import { Entry } from './selector';
import { EMPTY_KEY } from 'shared/constants';

export const getInputVariablesFromEntries = (
  entries: Entry[],
): RaporttiInput => {
  const variables: { [key: string]: any } = {};
  entries.forEach(entry => {
    if (entry.field === EMPTY_KEY) {
      return;
    }
    switch (entry.type) {
      case 'String':
        variables[entry.field] = `${entry.value}`;
        break;
      case 'Boolean':
        variables[entry.field] = Boolean(entry.value);
        break;
      case 'Int':
        variables[entry.field] = Number(entry.value);
        break;
      case 'FloatIntervalInput':
      case 'IntIntervalInput':
      case 'DateTimeIntervalInput':
        const field = entry.rel === 'gte' ? 'start' : 'end';
        const value =
          entry.type === 'DateTimeIntervalInput'
            ? entry.value
            : Number(entry.value);
        // There can be multiple selectors for same input field for intervals
        if (variables[entry.field]) {
          variables[entry.field][field] = value;
        } else {
          variables[entry.field] = { [field]: value };
        }
        break;
      default:
        break;
    }
  });
  return variables as RaporttiInput;
};
