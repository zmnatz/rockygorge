import React from 'react';

export type FieldType = 'text' | 'number' | 'boolean' | 'textarea' | 'keyValueMap' | 'textList';

export interface FieldConfig<T> {
  name: keyof T;
  label: string;
  type?: FieldType;
  render?: (item: T, onChange: (updated: T) => void) => React.ReactNode;
}

export interface Column<T> {
  header: string;
  render: (item: T) => React.ReactNode;
}

export interface AdminPageProps<T> {
  title: string;
  endpoint: string;
  columns: Column<T>[];
  fields: FieldConfig<T>[];
  getItemId: (item: T) => string;
  initialDataTransform?: (data: any) => T[];
  saveDataTransform?: (items: T[]) => any;
}
