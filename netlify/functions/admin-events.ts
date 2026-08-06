import { createAdminHandler } from './admin-handler';
import { ADMIN_FILE_PATHS } from '../../src/utils/admin-file-paths';

export const config = {
    path: '/api/admin-events',
};

export const handler = createAdminHandler({
    filePath: ADMIN_FILE_PATHS.events,
    branchPrefix: 'admin-events',
    label: 'events',
});
