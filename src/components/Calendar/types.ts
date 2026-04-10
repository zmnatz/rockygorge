'use client';


export type CalendarEvent = {
  summary: string;
  location: string;
  htmlLink: string;
  start: string;
  end: string;
};

export interface CalendarFilter {
  name: string;
  matches?: string;
  notMatches?: string;
  limit?: number;
  hideSummary?: boolean;
}

export interface CalendarAPIResponse {
  items: {
    summary: string;
    location: string;
    htmlLink: string;
    start: {
      dateTime: string;
      date: string;
    };
    end: {
      dateTime: string;
      date: string;
    };
  }[];
}
