import { describe, it, expect } from 'vitest';
import forms from '@content/forms.yml';
import { Form } from '@/types/data';
import { validateDataArray } from './helpers/data-shape';

validateDataArray<Form>(forms, {
  label: 'forms.yml',
  idField: 'slug',
  requiredFields: [
    { name: 'slug', type: 'string' },
    { name: 'href', type: 'string' },
    { name: 'formId', type: 'string' },
    { name: 'title', type: 'string' },
    { name: 'width', type: 'number' },
    { name: 'height', type: 'number' },
    { name: 'hide', type: 'boolean' },
    { name: 'summary', type: 'string', optional: true },
    { name: 'formLink', type: 'string', optional: true },
  ],
});

describe('forms.yml', () => {
  it('dimensions are positive numbers', () => {
    forms.forEach((form: Form) => {
      expect(form.width).toBeGreaterThan(0);
      expect(form.height).toBeGreaterThan(0);
    });
  });
});
