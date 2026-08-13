import Link from 'next/link';
import { AdminPage } from '../../src/components/AdminPage';
import { RequireAuth } from '../../src/components/RequireAuth';
import adminYaml from '@config/admin.yml';
import { generateLabel } from '../../src/utils/labels';
import { ITEM_ID_MAPPINGS, RENDER_MAPPINGS, TRANSFORM_MAPPINGS } from '../../src/utils/admin-config';
import { ADMIN_FILE_PATHS } from '../../src/utils/admin-file-paths';
import fs from 'node:fs';
import { load } from 'js-yaml';
import path from 'node:path';
import type { Column, FieldConfig, FieldType, GlobalFieldConfig } from '../../src/components/AdminPage/types';

interface AdminYamlColumn {
  field: string;
  header?: string;
  render?: string;
}

interface AdminYamlField {
  name: string;
  label?: string;
  type?: FieldType;
  options?: string[];
}

interface AdminYamlGlobalField {
  name: string;
  label?: string;
  type?: FieldType;
  options?: string[];
}

interface AdminYamlConfig {
  title: string;
  endpoint: string;
  getItemId: string;
  transforms?: string;
  columns?: AdminYamlColumn[];
  fields?: AdminYamlField[];
  globalFields?: AdminYamlGlobalField[];
  editOnly?: boolean;
  reorderable?: boolean;
  createDefaults?: Record<string, unknown>;
  generateFromCalendar?: boolean;
}

interface GenericAdminProps {
  initialData: unknown;
  type: string;
}

export default function GenericAdmin({ initialData, type }: GenericAdminProps) {
  const yamlConfig = adminYaml[type] as AdminYamlConfig | undefined;

  if (!yamlConfig) {
    return <div>Admin page not found.</div>;
  }

  const transform = yamlConfig.transforms ? TRANSFORM_MAPPINGS[yamlConfig.transforms as keyof typeof TRANSFORM_MAPPINGS] : null;

  const getItemId = ITEM_ID_MAPPINGS[yamlConfig.getItemId] ?? ((item: Record<string, unknown>) => String(item.id || ''));

  const columns: Column<Record<string, unknown>>[] = (yamlConfig.columns || []).map((col) => ({
    header: col.header || generateLabel(col.field),
    render: (item: Record<string, unknown>) => {
      const renderer = RENDER_MAPPINGS[col.render || 'default'] || RENDER_MAPPINGS.default;
      return renderer(item, col.field);
    },
  }));

  if (type === 'store') {
    columns.push({
      header: 'Transactions',
      render: (item: Record<string, unknown>) =>
        item.slug ? (
          <Link href={`/admin/transactions/${item.slug}`}>View</Link>
        ) : (
          ''
        ),
    });
  }

  const fields: FieldConfig<Record<string, unknown>>[] = (yamlConfig.fields || []).map((f) => ({
    ...f,
    label: f.label || generateLabel(f.name),
    name: f.name as keyof Record<string, unknown>,
  }));

  const globalFields: GlobalFieldConfig[] = (yamlConfig.globalFields || []).map((f) => ({
    ...f,
    label: f.label || generateLabel(f.name),
  }));

  return (
    <RequireAuth>
      <AdminPage<Record<string, unknown>>
        title={yamlConfig.title}
        endpoint={yamlConfig.endpoint}
        initialData={initialData}
        getItemId={getItemId}
        initialDataTransform={transform?.initialDataTransform}
        initialGlobalsTransform={transform?.initialGlobalsTransform}
        saveDataTransform={transform?.saveDataTransform}
        globalFields={globalFields}
        columns={columns}
        fields={fields}
        editOnly={yamlConfig.editOnly === true}
        reorderable={yamlConfig.reorderable === true}
        createDefaults={yamlConfig.createDefaults || {}}
        idFieldName={yamlConfig.getItemId}
        generateFromCalendar={yamlConfig.generateFromCalendar === true}
      />
    </RequireAuth>
  );
}

export async function getStaticPaths() {
  return {
    paths: Object.keys(adminYaml).map((type) => ({
      params: { type },
    })),
    fallback: false,
  };
}

export async function getStaticProps({ params }: { params?: { type: string } }) {
  const type = params?.type;
  const config = adminYaml[type];

  if (!config) {
    return { notFound: true };
  }

  const filePath = path.join(process.cwd(), ADMIN_FILE_PATHS[type]);
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const data = load(fileContents);

  return {
    props: {
      initialData: data,
      type,
    },
  };
}