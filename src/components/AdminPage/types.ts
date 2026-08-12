import type React from 'react';

export type FieldType = 'text' | 'number' | 'boolean' | 'textarea' | 'keyValueMap' | 'textList' | 'textKeyValueMap' | 'select' | 'subscriptionList';

export interface FieldConfig<T> {
  name: keyof T;
  label: string;
  type?: FieldType;
  options?: string[];
  render?: (item: T, onChange: (updated: T) => void) => React.ReactNode;
}

export interface GlobalFieldConfig {
  name: string;
  label: string;
  type?: FieldType;
  options?: string[];
  render?: (value: Record<string, unknown>, onChange: (newValue: Record<string, unknown>) => void) => React.ReactNode;
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
  initialData?: unknown;
  initialDataTransform?: (data: unknown) => T[];
  initialGlobalsTransform?: (data: unknown) => Record<string, unknown>;
  saveDataTransform?: (items: T[], globals?: Record<string, unknown>) => unknown;
  globalFields?: GlobalFieldConfig[];
  editOnly?: boolean;
  reorderable?: boolean;
  createDefaults?: Record<string, unknown>;
  idFieldName?: string;
  generateFromCalendar?: boolean;
}
