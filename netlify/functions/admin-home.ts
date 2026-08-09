import { createAdminHandler } from './admin-handler';
import { ADMIN_FILE_PATHS } from '../../src/utils/admin-file-paths';

export const config = {
    path: '/api/admin-home',
};

export const handler = createAdminHandler({
    filePath: ADMIN_FILE_PATHS.home,
    branchPrefix: 'admin-home',
    label: 'home',
});