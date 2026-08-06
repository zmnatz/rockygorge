declare module '*.yml';

declare module '@content/forms.yml' {
  const forms: import('./data').Form[];
  export default forms;
}

declare module '@content/events.yml' {
  const events: import('./data').Event[];
  export default events;
}

declare module '@content/store.yml' {
  const store: import('./data').Product[];
  export default store;
}

declare module '@content/links.yml' {
  const links: import('./data').Link[];
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
