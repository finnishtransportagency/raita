import { RaitaRole } from './user';

export type PageDescription = {
  labelTranslationKey: string;
  href: string;
  requiredRole: RaitaRole;
};

// The routing is defined by the file structure but also defined here for use by the navigation bar
// requiredRole is also defined by page components
// TODO: can this be simplified?
export const RaitaPages: PageDescription[] = [
  {
    labelTranslationKey: 'page_labels.reports',
    href: '/reports',
    requiredRole: RaitaRole.Read,
  },
  {
    labelTranslationKey: 'page_labels.admin.logs',
    href: '/admin/logs',
    requiredRole: RaitaRole.Admin,
  },
  {
    labelTranslationKey: 'page_labels.admin.delete',
    href: '/admin/delete',
    requiredRole: RaitaRole.Admin,
  },
];
