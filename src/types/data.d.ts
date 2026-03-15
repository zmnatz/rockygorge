export interface Form {
  id: string;
  formId: string;
  title: string;
  description: string;
  width: number;
  height: number;
  hide: boolean;
}

export interface Product {
  name: string;
  hide?: boolean;
  defaultAmount: number;
  description: string;
  info: string;
  title: string;
  options: Array<{ name: string; value: number }>;
  donation?: boolean;
  details?: string;
  supporters?: string[];
  flexiblePayment?: boolean;
  children?: React.ReactNode;
  subscriptions?: Array<{
    name: string;
    id: string;
    description: string;
    options: Array<{ label: string; value: string }>;
    value?: string;
  }>;
}

export interface Link {
  id: string;
  title: string;
  description: string;
  header: boolean;
  hide?: boolean;
}

export interface GauntletEntry {
  name: string;
  position?: string;
  time: string;
  stroke?: number;
}

declare module '*.yml' {
  const content: any;
  export default content;
}

declare module '@/data/forms.yml' {
  const forms: Form[];
  export default forms;
}

declare module '@/data/store.yml' {
  const store: Product[];
  export default store;
}

declare module '@/data/links.yml' {
  const links: Link[];
  export default links;
}

declare module '@/data/gauntlet.yml' {
  const gauntlet: GauntletEntry[];
  export default gauntlet;
}

declare module '@/data/gauntlet-2023-2024.yml' {
  const gauntlet2023: GauntletEntry[];
  export default gauntlet2023;
}

declare module '../../src/data/forms.yml' {
  const forms: Form[];
  export default forms;
}

declare module '../../src/data/gauntlet.yml' {
  const gauntlet: GauntletEntry[];
  export default gauntlet;
}