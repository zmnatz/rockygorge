import { dump, load } from 'js-yaml';

export function roundtripYaml<T>(data: unknown): T {
  return load(dump(data)) as T;
}

export function simulateServerSave<T>(data: unknown): T {
  const json = JSON.stringify(data);
  return roundtripYaml<T>(JSON.parse(json));
}
