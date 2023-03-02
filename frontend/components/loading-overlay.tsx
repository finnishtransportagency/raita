import { useTranslation } from 'next-i18next';
import { Spinner } from './spinner';

export function LoadingOverlay() {
  const { t } = useTranslation(['common']);

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 w-full h-screen z-50 overflow-hidden bg-gray-700 opacity-75 flex flex-col items-center justify-center">
      <Spinner />
      <h2 className="text-center text-white text-xl font-semibold">
        {t('common:loading')}
      </h2>
      <p className="w-1/3 text-center text-white">
        {t('common:iam_problem_contact_info')}
      </p>
    </div>
  );
}

export default LoadingOverlay;
