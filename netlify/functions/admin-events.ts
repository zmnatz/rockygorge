import { createAdminHandler } from './admin-handler';

export const config = {
    path: '/api/admin-events',
};

export const handler = createAdminHandler({
    filePath: 'src/data/events.yml',
    branchPrefix: 'admin-events',
    label: 'events',
});
