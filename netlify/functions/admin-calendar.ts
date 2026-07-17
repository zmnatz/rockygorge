import { createAdminHandler } from './admin-handler';

export const config = {
    path: '/api/admin-calendar',
};

export const handler = createAdminHandler({
    filePath: 'src/data/calendar.yml',
    branchPrefix: 'admin-calendar',
    label: 'calendar',
});
