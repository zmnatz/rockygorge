import { createAdminHandler } from './admin-handler';
import { ADMIN_FILE_PATHS } from '../../src/utils/admin-file-paths';

export const config = {
    path: '/api/admin-link-mappings',
};

export const handler = createAdminHandler({
    filePath: ADMIN_FILE_PATHS.link_mappings,
    branchPrefix: 'admin-link-mappings',
    label: 'link_mappings',
});
