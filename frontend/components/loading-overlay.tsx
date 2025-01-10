import { useTranslation } from 'next-i18next';
import { Spinner } from './spinner';

export function LoadingOverlay() {
  const { t } = useTranslation(['common']);

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 w-full h-screen z-50 overflow-hidden bg-gray-700 opacity-75 flex flex-col items-center justify-center">
      <Spinner size={12} />
      <h2
        className="text-center text-white text-xl font-semibold"
        suppressHydrationWarning
      >
        {t('common:loading')}
      </h2>
      <p className="w-1/3 text-center text-white" suppressHydrationWarning>
        {t('common:iam_problem_contact_info')}
      </p>
      {/* Hardcoded error message if javascript isn't working. */}
      <noscript>
        <p>
          Jos näet tämän virheviestin, syynä saattaa olla vanhojen
          javascript-tiedostojen säilyminen välimuistissa sivustopäivityksen
          jälkeen.
        </p>
        Mahdollisia korjauksia:
        <ul>
          <li>Tyhjennä selaimen välimuisti tältä sivulta: CTRL+F5</li>
          <li>Kokeile toista selainta tai selaimen incognito-tilaa</li>
        </ul>
      </noscript>
    </div>
  );
}

export default LoadingOverlay;
