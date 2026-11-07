const SIDE_NAME = /^(.+) (M|W)?D(\d+)$/;

export interface TeamSide {
  /** The club, with men's and women's sides as separate clubs, e.g. "NOVA Women". */
  clubName: string;
  /** The club's name without the women's suffix, e.g. "NOVA". */
  baseName: string;
  gender: 'M' | 'W';
  level: number;
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
