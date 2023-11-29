import { PropsWithChildren } from 'react';
import Head from 'next/head';

type Props = {
  title: string;
  headerText: string;
};
/**
 * Header to display on all pages
 */
const Header = ({ title, headerText, children }: PropsWithChildren<Props>) => {
  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <div className="bg-primary text-white">
        <div className="container mx-auto px-16 py-6">
          <header>
            <h1 className="text-4xl">{headerText}</h1> {children}
          </header>
        </div>
      </div>
    </>
  );
};

export default Header;
