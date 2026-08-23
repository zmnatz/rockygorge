import type { GauntletEntry } from "@/types/data";
import season20232024 from "./2023-2024.yml";
import season20252026 from "./2025-2026.yml";
import current from "./index.yml";

export const seasons: Record<string, GauntletEntry[]> = {
  current,
  "2023-2024": season20232024,
  "2025-2026": season20252026,
};
