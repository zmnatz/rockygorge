import { AdminPage } from '../../src/components/AdminPage';
import adminYaml from '../../src/data/admin.yml';
import { generateLabel } from '../../src/utils/labels';
import { ITEM_ID_MAPPINGS, RENDER_MAPPINGS, TRANSFORM_MAPPINGS } from '../../src/utils/admin-config';
import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';

export default function GenericAdmin({ initialData, type }) {
  const yamlConfig = adminYaml[type];

  if (!yamlConfig) {
    return <div>Admin page not found.</div>;
  }

  const transform = yamlConfig.transforms ? TRANSFORM_MAPPINGS[yamlConfig.transforms as keyof typeof TRANSFORM_MAPPINGS] : null;

  return (
    <AdminPage
      title={yamlConfig.title}
      endpoint={yamlConfig.endpoint}
      initialData={initialData}
      getItemId={ITEM_ID_MAPPINGS[yamlConfig.getItemId] ?? ((item: any) => item.id)}
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
