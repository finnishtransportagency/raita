import { Datepicker, Dropdown } from './components';
import { items } from './dummy';
import { toItem } from './shared/util';

export function App() {
  return (
    <main>
      <div className="cols pad">
        <div>
          <form className="space-y">
            <fieldset>
              <legend>Hakuehdot</legend>

              <Dropdown caption={'Ehto 1'} items={[]} />
              <Dropdown caption={'Ehto 2'} items={[]} />
            </fieldset>

            <fieldset>
              <legend>Aikaväli</legend>

              <div className="cols">
                <Datepicker caption={'Alku'} />
                <Datepicker caption={'Loppu'} />
              </div>
            </fieldset>

            <fieldset>
              <legend>Raporttityypit</legend>

              <Dropdown
                caption={'Tyyppi'}
                multiple={true}
                items={[toItem('one', 'One'), toItem('two', 'Two')]}
              />
            </fieldset>

            <button>Hae raportit</button>
          </form>
        </div>

        <div className="space-y">
          <section>
            <header>Tulokset</header>

            <ul>
              {items.map((it, i) => (
                <li key={it.key}>{it.key}</li>
              ))}
            </ul>

            <div className="space-y">
              <ul className="pager">
                <li className="pager__item">Prev</li>
                <li className="pager__item">1</li>
                <li className="pager__item">2</li>
                <li className="pager__item">Next</li>
              </ul>

              <button>Lataa kaikki</button>
            </div>

            <footer>
              <Dropdown
                caption={'Tuloksia/sivu'}
                items={[
                  toItem('one', '5'),
                  toItem('two', '10'),
                  toItem('three', '15'),
                ]}
              />
            </footer>
          </section>
        </div>
      </div>
    </main>
  );
}

export default App;
