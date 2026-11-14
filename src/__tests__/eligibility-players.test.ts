import { describe, expect, it } from 'vitest';
import { eligibilityPlayerIds } from '../../scripts/lib/eligibility-players';

const client = (current: string[], past: string[]) => ({
  playerIndex: async () => ({
    season: '2026/2027',
    players: Object.fromEntries(current.map((id) => [id, { name: id, clubs: ['rocky-gorge'] }])),
  }),
  pastPlayerIds: async () => Object.fromEntries(past.map((id) => [id, { name: id }])),
});

describe('eligibilityPlayerIds', () => {
  it("has this season's players and every Locked Season's", async () => {
    const ids = await eligibilityPlayerIds(client(['now', 'both'], ['before', 'both']));
    expect([...ids].sort()).toEqual(['before', 'both', 'now']);
  });

  it("throws when the published data can't be read", async () => {
    const failing = {
      ...client([], []),
      pastPlayerIds: async () => {
        throw new Error('offline');
      },
    };
    await expect(eligibilityPlayerIds(failing)).rejects.toThrow('offline');
  });
});
