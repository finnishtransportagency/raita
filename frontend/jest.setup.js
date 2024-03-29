import '@testing-library/jest-dom/extend-expect';

jest.mock('react-i18next', () => ({
  // this mock makes sure any components using the translate hook can use it without a warning being shown
  useTranslation: () => {
    return {
      t: str => str,
      i18n: {
        changeLanguage: () => new Promise(() => {}),
      },
    };
  },
}));

const useRouter = jest.fn();
jest.mock('next/router', () => ({
  useRouter,
}));
useRouter.mockReturnValue({
  query: {},
  push: jest.fn(),
});
