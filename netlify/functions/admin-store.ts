import { createAdminHandler } from './admin-handler';

export const config = {
    path: '/api/admin-store',
};

export const handler = createAdminHandler({
    filePath: 'content/store.yml',
    branchPrefix: 'admin-store',
    label: 'store',
});
