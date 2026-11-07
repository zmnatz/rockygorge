const SIDE_NAME = /^(.+) (M|W)?D(\d+)$/;

export interface TeamSide {
  /** The club, with men's and women's sides as separate clubs, e.g. "NOVA Women". */
  clubName: string;
  /** The club's name without the women's suffix, e.g. "NOVA". */
  baseName: string;
  gender: 'M' | 'W';
  level: number;
}

/** The National Championship Series covers men's divisions 1 to 3 and women's 1 and
 *  2 (Senior Club Regulations, Terms and Definitions 34). Matches below that don't
 *  count towards eligibility, so those sides aren't assessed. */
export function isNcsSide({ gender, level }: Pick<TeamSide, 'gender' | 'level'>): boolean {
  return level <= (gender === 'W' ? 2 : 3);
}

/** Reads a side's club and division from its name, e.g. "NOVA WD3". A team name
 *  that doesn't end in a division gives null. */
export function parseTeamSide(teamName: string): TeamSide | null {
  const match = teamName.match(SIDE_NAME);
  if (!match) return null;
  const [, baseName, gender, level] = match;
  return {
    clubName: gender === 'W' ? `${baseName} Women` : baseName,
    baseName,
    gender: gender === 'W' ? 'W' : 'M',
    level: Number(level),
  };
}
