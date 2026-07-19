import { createAdminHandler } from './admin-handler';

export const config = {
    path: '/api/admin-link-mappings',
};

export const handler = createAdminHandler({
    filePath: 'config/link_mappings.yml',
    branchPrefix: 'admin-link-mappings',
    label: 'link mappings',
});
