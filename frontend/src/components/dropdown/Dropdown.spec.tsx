import { render } from '@testing-library/react';
import { toItem } from '../../shared/util';
import { Dropdown } from './Dropdown';

test('Dropdown', () => {
  render(<Dropdown items={[]} caption={'asdf'} />);
  render(
    <Dropdown
      items={[toItem('one', 'one')]}
      caption={'multiple'}
      multiple={true}
    />,
  );
});
