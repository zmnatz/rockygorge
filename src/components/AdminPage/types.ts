import React from 'react';

export type FieldType = 'text' | 'number' | 'boolean' | 'textarea' | 'keyValueMap' | 'textList' | 'textKeyValueMap';

export interface FieldConfig<T> {
  name: keyof T;
  label: string;
  type?: FieldType;
  render?: (item: T, onChange: (updated: T) => void) => React.ReactNode;
}

export interface GlobalFieldConfig {
  name: string;
  label: string;
  type?: FieldType;
  render?: (value: any, onChange: (newValue: any) => void) => React.ReactNode;
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
  initialData?: any;
  initialDataTransform?: (data: any) => T[];
  initialGlobalsTransform?: (data: any) => any;
  saveDataTransform?: (items: T[], globals?: any) => any;
  globalFields?: GlobalFieldConfig[];
}
