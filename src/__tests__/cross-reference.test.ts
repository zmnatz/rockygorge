import { describe, it, expect } from 'vitest';
import events from '@content/events.yml';
import store from '@content/store.yml';
import forms from '@content/forms.yml';
import { Event, Product, Form } from '@/types/data';

describe('event cross-references', () => {
  const visibleEvents = events.filter((e: Event) => !e.hide);
  const storeSlugs = new Set(store.map((s: Product) => s.slug));
  const formSlugs = new Set(forms.map((f: Form) => f.slug));

  it('every visible event with a matching store item has a valid store entry', () => {
    visibleEvents.forEach((event: Event) => {
      if (storeSlugs.has(event.slug)) {
        const storeItem = store.find((s: Product) => s.slug === event.slug);
        expect(storeItem).toBeDefined();
        expect(storeItem!.slug).toBe(event.slug);
      }
    });
  });

  it('every visible event with a matching form has a valid form entry', () => {
    visibleEvents.forEach((event: Event) => {
      if (formSlugs.has(event.slug)) {
        const form = forms.find((f: Form) => f.slug === event.slug);
        expect(form).toBeDefined();
        expect(form!.slug).toBe(event.slug);
      }
    });
  });

  it('no event references a store item that doesnt exist', () => {
    const eventSlugs = events.map((e: Event) => e.slug);
    eventSlugs.forEach((slug) => {
      if (storeSlugs.has(slug)) {
        const storeItem = store.find((s: Product) => s.slug === slug);
        expect(storeItem).toBeDefined();
      }
    });
  });

  it('no event references a form that doesnt exist', () => {
    const eventSlugs = events.map((e: Event) => e.slug);
    eventSlugs.forEach((slug) => {
      if (formSlugs.has(slug)) {
        const form = forms.find((f: Form) => f.slug === slug);
        expect(form).toBeDefined();
      }
    });
  });

  it('every visible event has at least one organizer', () => {
    visibleEvents.forEach((event: Event) => {
      expect(Array.isArray(event.organizers)).toBe(true);
      expect(event.organizers.length).toBeGreaterThan(0);
    });
  });
});
