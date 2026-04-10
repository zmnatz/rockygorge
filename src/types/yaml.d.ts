declare module '*.yml';

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

declare module './data/gauntlet-2023-2024.yml' {
  const gauntlet2023: GauntletEntry[];
  export default gauntlet2023;
}

declare module '../../data/forms.yml' {
  const forms: Form[];
  export default forms;
}

declare module '../../data/gauntlet.yml' {
  const gauntlet: GauntletEntry[];
  export default gauntlet;
}

declare module '@/data/calendar.yml' {
  const calendarInfo: {
    months: number,
    filters: {
      name: string;
      matches?: string;
      notMatches?: string;
      limit?: number;
      hideSummary?: boolean;
    }[]
  };
  export default calendarInfo;
}