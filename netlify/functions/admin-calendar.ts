import { createAdminHandler } from './admin-handler';
import { ADMIN_FILE_PATHS } from '../../src/utils/admin-file-paths';

export const config = {
    path: '/api/admin-calendar',
};

export const handler = createAdminHandler({
    filePath: ADMIN_FILE_PATHS.calendar,
    branchPrefix: 'admin-calendar',
    label: 'calendar',
});
