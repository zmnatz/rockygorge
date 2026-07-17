import React from 'react';
import { AdminPage } from '../../src/components/AdminPage';
import adminYaml from '../../src/data/admin.yml';
import { generateLabel } from '../../src/utils/labels';
import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';

const ITEM_ID_MAPPINGS: Record<string, (item: any) => string> = {
  slug: (item) => item.slug,
};

const RENDER_MAPPINGS: Record<string, (item: any, field: string) => any> = {
  boolean: (item, field) => item[field] ? 'Yes' : 'No',
  calendarMatches: (item) => item.matches || item.notMatches || '-',
  default: (item, field) => item[field],
};

const TRANSFORM_MAPPINGS: Record<string, {
  initialDataTransform: (data: any) => any[],
  initialGlobalsTransform: (data: any) => any,
  saveDataTransform: (items: any[], globals?: any) => any,
}> = {
  calendar: {
    initialDataTransform: (data) => data.filters,
    initialGlobalsTransform: (data) => ({ months: data.months }),
    saveDataTransform: (items, globals) => ({
      months: globals.months,
      filters: items,
    }),
  },
  linkMappings: {
    initialDataTransform: (data) => [
      { 
        type: 'store', 
        mappings: Object.entries(data.store?.mappings || {}).map(([name, value]) => ({ name, value })), 
        default: data.store?.default 
      },
      { 
        type: 'forms', 
        mappings: Object.entries(data.forms?.mappings || {}).map(([name, value]) => ({ name, value })), 
        default: data.forms?.default 
      },
    ],
    initialGlobalsTransform: () => ({}),
    saveDataTransform: (items) => {
      const result = {};
      items.forEach((item: any) => {
        const mappings = {};
        (item.mappings || []).forEach((m: any) => {
          mappings[m.name] = m.value;
        });
        result[item.type] = {
          mappings,
          default: item.default,
        };
      });
      return result;
    },
  },
};

export default function GenericAdmin({ initialData, type }) {
  const yamlConfig = adminYaml[type];

  if (!yamlConfig) {
    return <div>Admin page not found.</div>;
  }

  const transform = yamlConfig.transforms ? TRANSFORM_MAPPINGS[yamlConfig.transforms] : null;

  return (
    <AdminPage
      title={yamlConfig.title}
      endpoint={yamlConfig.endpoint}
      initialData={initialData}
      getItemId={ITEM_ID_MAPPINGS[yamlConfig.getItemId] || ITEM_ID_MAPPINGS.id}
      initialDataTransform={transform?.initialDataTransform}
      initialGlobalsTransform={transform?.initialGlobalsTransform}
      saveDataTransform={transform?.saveDataTransform}
      globalFields={(yamlConfig.globalFields || []).map((f: any) => ({
        ...f,
        label: f.label || generateLabel(f.name),
      }))}
      columns={(yamlConfig.columns || []).map((col: any) => ({
        header: col.header || generateLabel(col.field),
        render: (item: any) => {
          const renderer = RENDER_MAPPINGS[col.render] || RENDER_MAPPINGS.default;
          return renderer(item, col.field);
        },
      }))}
      fields={(yamlConfig.fields || []).map((f: any) => ({
        ...f,
        label: f.label || generateLabel(f.name),
      }))}
    />
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

export async function getStaticProps({ params }) {
  const type = params?.type;
  const config = adminYaml[type];

  if (!config) {
    return { notFound: true };
  }

  const filePath = path.join(process.cwd(), config.dataFilePath);
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const data = yaml.load(fileContents);

  return {
    props: {
      initialData: data,
      type,
    },
  };
}
