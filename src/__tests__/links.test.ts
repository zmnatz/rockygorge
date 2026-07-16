import { describe, it, expect } from 'vitest';
import { getLinkText } from '@/utils/links';

describe('getLinkText', () => {
  describe('store type', () => {
    it('returns "Buy Tickets" for ticket-related items', () => {
      expect(getLinkText('store', { info: 'Buy tickets for the tournament' })).toBe('Buy Tickets');
    });

    it('returns "Sponsor the Event" for sponsor-related items', () => {
      expect(getLinkText('store', { info: 'Sponsor the event and get recognition' })).toBe('Sponsor the Event');
    });

    it('returns "Make a Donation" for donation-related items', () => {
      expect(getLinkText('store', { description: 'Make a donation to the club' })).toBe('Make a Donation');
    });

    it('returns "Pay Dues" for dues-related items', () => {
      expect(getLinkText('store', { title: 'Pay Dues' })).toBe('Pay Dues');
    });

    it('returns "Buy Gear" for gear-related items', () => {
      expect(getLinkText('store', { info: 'Buy gear for the season' })).toBe('Buy Gear');
    });

    it('returns default when no pattern matches', () => {
      expect(getLinkText('store', { info: 'Some random item' })).toBe('View Item');
    });

    it('falls back through info -> description -> title', () => {
      expect(getLinkText('store', { description: 'sponsor something', title: 'Other' })).toBe('Sponsor the Event');
    });
  });

  describe('forms type', () => {
    it('returns "Nominate Member" for nomination forms', () => {
      expect(getLinkText('forms', { info: 'Nominate a member for the award' })).toBe('Nominate Member');
    });

    it('returns "Submit Travel Info" for travel forms', () => {
      expect(getLinkText('forms', { description: 'Submit your travel info' })).toBe('Submit Travel Info');
    });

    it('returns "Interest Form" for interest/join forms', () => {
      expect(getLinkText('forms', { info: 'Fill out this interest form to join' })).toBe('Interest Form');
    });

    it('returns "RSVP" for RSVP forms', () => {
      expect(getLinkText('forms', { title: 'RSVP for the event' })).toBe('RSVP');
    });

    it('returns default when no pattern matches', () => {
      expect(getLinkText('forms', { info: 'Something else' })).toBe('Fill out Form');
    });
  });
});
