import { ReactNode } from 'react';

export function Layout(props: Props) {
  const { children } = props;
  return <>{children}</>;
}

export default Layout;

//

export type Props = {
  children?: ReactNode;
};
