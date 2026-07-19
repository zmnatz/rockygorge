import { createAdminHandler } from './admin-handler';

export const config = {
    path: '/api/admin-calendar',
};

export const handler = createAdminHandler({
    filePath: 'content/calendar.yml',
    branchPrefix: 'admin-calendar',
    label: 'calendar',
});
