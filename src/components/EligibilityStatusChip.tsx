import Chip from '@mui/material/Chip';
import type { PlayerEligibility } from '@/types/eligibility';

interface EligibilityStatusChipProps {
  player: Pick<PlayerEligibility, 'eligible' | 'pending'>;
  /** Names the side, e.g. "D1", where more than one verdict is shown. */
  sideLabel?: string;
  onClick?: () => void;
}

/** A verdict as a chip: ineligible, on track (still needs matches) or eligible. */
export function EligibilityStatusChip({ player, sideLabel, onClick }: EligibilityStatusChipProps) {
  const [color, status] = !player.eligible
    ? (['error', 'INELIGIBLE'] as const)
    : player.pending.length > 0
      ? (['warning', 'ON TRACK'] as const)
      : (['success', 'ELIGIBLE'] as const);
  return (
    <Chip size="small" color={color} label={sideLabel ? `${sideLabel} ${status}` : status} onClick={onClick} />
  );
}
