import { RaitaRole } from './user';

export type PageDescription = {
  labelTranslationKey: string;
  href: string;
  requiredRole: RaitaRole;
};

// TODO: these are defiend both here and through the file structure
export const RaitaPages: PageDescription[] = [
  {
    labelTranslationKey: 'page_labels.reports',
    href: '/reports',
    requiredRole: RaitaRole.Read,
  },
  // {
  //   labelTranslationKey: 'page_labels.admin.logs',
  //   href: '/admin/logs',
  //   requiredRole: RaitaRole.Admin,
  // },
  {
    labelTranslationKey: 'page_labels.admin.delete',
    href: '/admin/delete',
    requiredRole: RaitaRole.Admin,
  },
];
