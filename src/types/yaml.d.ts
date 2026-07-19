declare module '*.yml';

declare module '@content/forms.yml' {
  const forms: Form[];
  export default forms;
}

declare module '@content/store.yml' {
  const store: Product[];
  export default store;
}

declare module '@content/links.yml' {
  const links: Link[];
  export default links;
}

declare module '@content/calendar.yml' {
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
