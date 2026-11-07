import Chip from '@mui/material/Chip';
import type { PlayerEligibility } from '@/types/eligibility';

/** A verdict as a chip: ineligible, on track (still needs matches) or eligible. */
export function EligibilityStatusChip({ player }: { player: Pick<PlayerEligibility, 'eligible' | 'pending'> }) {
  if (!player.eligible) return <Chip size="small" color="error" label="INELIGIBLE" />;
  return player.pending.length > 0 ? (
    <Chip size="small" color="warning" label="ON TRACK" />
  ) : (
    <Chip size="small" color="success" label="ELIGIBLE" />
  );
}
