import { createAdminHandler } from './admin-handler';

export const config = {
    path: '/api/admin-forms',
};

export const handler = createAdminHandler({
    filePath: 'content/forms.yml',
    branchPrefix: 'admin-forms',
    label: 'forms',
});
