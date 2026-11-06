# Eligibility can run from the match record

The eligibility tool can run for any club with exactly two sides from a snapshot of CMS lineups (`public/data/players/participation.json`), without a Rugby Xplorer CSV. Rows take the existing `PlayerRow` shape, so the rules in `computeBreakdown` and ADR 008 apply unchanged. The CSV path stays, because only the report carries USA IDs and registration dates and it is the union's official count.

Decisions that differ from the CSV path, so they are not "fixed" later:

- **Join key**: players join across sides on the CMS player id, since the record has no USA ID. USA ID and Last Registered are hidden rather than shown blank.
- **Qualifying matches**: the CSV is taken as given, but the record includes everything the feed reports, so `nonQualifyingCompetitions` in `config/eligibility.yml` removes the National Championships, Super Regionals and 7s.
- **Coaches**: lineups list coaches, who are not playing appearances and are left out of the rows.
- **Substitutes**: a substitute counts only if a substitution event names them coming on. Where a side lists substitutes and none came on, the substitutions probably weren't entered, so counts may be low. That match and any result with no lineup are shown as gaps beside the verdicts rather than guessed at.
- **Which clubs**: only clubs with two ranked sides with qualifying matches in the record. The feed only covers competitions Rocky Gorge plays in, so a club's other side in another competition (e.g. James River MD2) leaves it unlisted. Clubs with three sides are left out because the rules encoded here are for two.
- **Season**: the latest season with results only.
