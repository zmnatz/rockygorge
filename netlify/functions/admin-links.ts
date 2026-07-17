import { createAdminHandler } from './admin-handler';

export const config = {
    path: '/api/admin-links',
};

export const handler = createAdminHandler({
    filePath: 'src/data/links.yml',
    branchPrefix: 'admin-links',
    label: 'links',
});
