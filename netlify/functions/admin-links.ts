import { createAdminHandler } from './admin-handler';

export const config = {
    path: '/api/admin-links',
};

export const handler = createAdminHandler({
    filePath: 'content/links.yml',
    branchPrefix: 'admin-links',
    label: 'links',
});
