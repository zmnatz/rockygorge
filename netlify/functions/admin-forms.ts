import { createAdminHandler } from './admin-handler';

export const config = {
    path: '/api/admin-forms',
};

export const handler = createAdminHandler({
    filePath: 'src/data/forms.yml',
    branchPrefix: 'admin-forms',
    label: 'forms',
});
