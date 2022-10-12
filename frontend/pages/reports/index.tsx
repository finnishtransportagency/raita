import { NextPage } from 'next';
import Head from 'next/head';

import { Button, Dropdown, Input, Pager } from 'components';

const ReportsIndex: NextPage = () => {
  return (
    <div>
      <Head>
        <title>Reports</title>
      </Head>

      <div className="container mx-auto">
        <header className="my-4">
          <h1 className="text-4xl">Reports</h1>
        </header>

        <div className="grid grid-cols-2 gap-4">
          <section>
            <header className="text-3xl border-b-2 border-gray-500 mb-4 pb-2">
              Error report search
            </header>
            <div className="space-y-4">
              <section>
                <header>Metadata</header>

                <div className="grid grid-cols-2 gap-2">
                  <Dropdown label="Filter 1" items={[]} />
                  <Dropdown label="Filter 2" items={[]} />
                  <Dropdown label="Filter 3" items={[]} />
                </div>
              </section>

              <section>
                <header>Time span</header>

                <div className="grid grid-cols-2 gap-2">
                  <Input label="Date 1" type={'date'} />
                  <Input label="Date 2" type={'date'} />
                </div>
              </section>

              <section>
                <header>Types</header>

                <div className="grid grid-cols-2 gap-2">
                  <Dropdown multiple={true} label="Selection" items={[]} />
                </div>
              </section>

              <footer>
                <Button label={'Search'} />
              </footer>
            </div>
          </section>

          <section>
            <header className="text-3xl border-b-2 border-gray-500 mb-4 pb-2">
              Results
            </header>

            <section>
              <header>Results</header>

              <div>
                <div>420 results</div>
                <div></div>
              </div>

              <div className="">
                <ul className="space-y-2 divide-y-2">
                  {Array(5)
                    .fill(0)
                    .map((_, i) => {
                      return (
                        <li key={i}>
                          <article className="px-4 py-2">
                            <header className="font-bold">Item title</header>

                            <div className="text-sm">
                              <p>Item body text</p>
                            </div>

                            <footer className="text-right space-x-2">
                              <Button
                                label="Preview"
                                size={'sm'}
                                type={'secondary'}
                              />
                              <Button
                                label="Download"
                                size={'sm'}
                                type={'secondary'}
                              />
                            </footer>
                          </article>
                        </li>
                      );
                    })}
                </ul>
              </div>

              <footer className="space-y-2 mt-2">
                <nav>
                  <Pager pages={[{}, {}, {}]} />
                </nav>

                <Button label="Download all" type="secondary" />
              </footer>
            </section>
          </section>
        </div>
      </div>

      <footer className="border-t-2 border-blue-500 mt-4 pt-4"></footer>
    </div>
  );
};

export default ReportsIndex;
