import { createAdminHandler } from './admin-handler';

export const config = {
    path: '/api/admin-store',
};

export const handler = createAdminHandler({
    filePath: 'src/data/store.yml',
    branchPrefix: 'admin-store',
    label: 'store',
});
