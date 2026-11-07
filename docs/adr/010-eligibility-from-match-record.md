# Eligibility can run from the match record

The eligibility tool can run for any club with exactly two sides from CMS lineups, without a Rugby Xplorer CSV. Deployed pages pull the selected club's matches live, falling back to the nightly snapshot (`public/data/players/participation.json`) and saying so if the pull fails; `next dev` and tests use only the snapshot, so development doesn't hit the CMS. A partial live pull counts as failed, since a partial count could wrongly pass or fail a player. Rows take the existing `PlayerRow` shape, so the rules in `computeBreakdown` and ADR 008 apply unchanged. The CSV path stays, because only the report carries USA IDs and registration dates and it is the union's official count.

Decisions that differ from the CSV path, so they are not "fixed" later:

- **Join key**: players join across sides on the CMS player id, since the record has no USA ID. USA ID and Last Registered are hidden rather than shown blank.
- **Qualifying matches**: the CSV is taken as given, but the record includes everything the feed reports, so `nonQualifyingCompetitions` in `config/eligibility.yml` removes 7s. League and playoff matches count, including Super Regionals and National Championships.
- **Coaches**: lineups list coaches, who are not playing appearances and are left out of the rows.
- **Both sides**: as in the CSV, every player gets a row on both sides, so a player only listed on one side still gets a verdict for the other.
- **Substitutes**: a listed player who never enters the game doesn't count as having played, so a substitute counts only if a substitution event names them coming on (a different spelling is accepted only when the surname points to exactly one listed substitute, because surnames repeat; events don't name a side, so the side comes from the player going off when that name is in the lineup). Where a side lists substitutes and none came on, the substitutions probably weren't entered, so counts may be low. That match and any result with no lineup are shown as gaps beside the verdicts rather than guessed at.
- **Which clubs**: clubs with two ranked sides in the qualifying competitions of the nightly fixture list, which covers the Capital union and Rocky Gorge's competitions. Men's and women's sides are separate clubs. No club fields three sides, so that case isn't handled. The nightly snapshot covers the same sides, so dev and the fallback match the live report; player history files still only cover Rocky Gorge's competitions.
- **Forfeits**: not played, so they neither count as participation nor flag as a missing lineup.
- **Season**: the latest season with results only.
