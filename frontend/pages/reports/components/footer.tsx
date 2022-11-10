import { clsx } from 'clsx';

import css from './footer.module.css';

export function Footer() {
  return (
    <footer className="bg-main-gray-75 text-white">
      <div className="container mx-auto px-16 py-12">
        <header className="text-lg">Väylävirasto</header>
      </div>
    </footer>
  );
}

export default Footer;
