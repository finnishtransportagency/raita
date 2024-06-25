import { currentMetadataDatabase, enableCsvPage } from './config';
import { RaitaRole } from './user';

export type PageDescription = {
  labelTranslationKey: string;
  href: string;
  requiredRole: RaitaRole;
};

// The routing is defined by the file structure but also defined here for use by the navigation bar
// requiredRole is also defined by page components
// TODO: can this be simplified?
export const getRaitaPages: () => PageDescription[] = () => {
  let pages: PageDescription[] = [];

  pages.push({
    labelTranslationKey: 'page_labels.reports',
    href: '/reports',
    requiredRole: RaitaRole.Read,
  });

  if (enableCsvPage) {
    pages.push({
      labelTranslationKey: 'page_labels.csv',
      href: '/csv',
      requiredRole: RaitaRole.Read,
    });
  }

  pages.push(
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
    {
      labelTranslationKey: 'page_labels.admin.process',
      href: '/admin/process',
      requiredRole: RaitaRole.Admin,
    },
  );
  return pages;
};
