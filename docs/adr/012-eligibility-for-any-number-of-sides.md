# Eligibility handles any number of sides, from the 2026-27 regulations

_The decisions below are current, but the code and its tests, including the Figure 1 table in `eligibility-regulation.test.ts`, now live in the `usa-club-rugby-eligibility` repo and reach this site as `@zmnatz/usa-club-rugby-data`. A change to the rules is made there. The packages also exclude socials, festivals and qualifier rosters from NCS Qualifying Matches, and add the Caution status._

The tool now evaluates a club with any number of sides under one rule, read from the 2026-27 Senior Club Regulations, replacing the upper/lower model of ADR 008 and the one-or-two limit of ADR 011. For a side, count its matches and those of every side below it: that total must reach the two-match minimum (Reg 3.5.2(a)) and be at least the total for every side above (Reg 3.5(d)(ii)), and no side above may have reached four matches (Reg 3.5(d)(i)). The top side only needs two matches at any level (Reg 3.5.2(b)), and that is also the whole rule for a one-side club (Reg 3.4.2(e)), so it isn't an interpretation as ADR 011 first said.

The code takes any number of sides, though with the divisions below left out a club has at most three in the rules. `eligibility-regulation.test.ts` holds all 20 rows of Figure 1 as the independent check; a change that breaks one is wrong.

Decisions, so they are not "fixed" later:

- **Limit on any upper side**: Reg 3.5(d)(i) says "the/either upper division team" and Figure 1 has 3/4/1 eligible for divisions 1 and 2 only, so four matches on any one side above loses eligibility below it, not four in total across them.
- **CSV reports**: any club's, with its sides read from the Team Name column. A report with several clubs offers a choice between them.
- **Divisions outside the NCS**: Men's IV and Women's III aren't in the NCS (Terms and Definitions, 34), and per the club their matches don't count, so those sides aren't assessed and don't affect a club's other sides. A club with only those sides isn't listed. Austin Blacks, with four sides, is assessed on three.
- **Crossovers and friendlies**: not NCS Qualifying Matches, excluded by competition name.
- **On track is experimental**: future playoff matches aren't always entered, so possible fixtures can be incomplete and the page says so.
- **Same name, two ids**: not merged, even with no match in common, because combining two people could wrongly pass one. The report shows both CMS ids, and merging the profiles in Rugby Xplorer is the fix.
- **Name Withheld**: a hidden profile, not a player. It gets no player record or eligibility row, and is red in match lineups. Red isn't a verdict, because a player can hold an approved exemption, so the wording says only that the name isn't public. A side whose lineup is entirely hidden shows as having no lineup, which is a known false gap.
- **Forfeits (Reg 3.4(h))**: count for the non-forfeiting side's rostered players, starters and replacements, and for no one on the forfeiting side. The non-forfeiting side is the one with the higher score. The 48-hour roster lock can't be seen in the data, so a roster entered late still counts. This replaces ADR 010's "Forfeits: not played".
- **Not covered**: Recognized Competitive Matches (Reg 3.4.3), playing for another club (Reg 3.4(e)) and waivers aren't in the data.

The union feed doesn't list all of its own fixtures, so the nightly job also reads each playing club's feed and keeps only the league's competitions. Clubs in other unions, such as Austin Blacks, aren't in the fixture lists and use a CSV report. Results before the current season are locked: no snapshot reads them again except for a format change or a manual `--full-history`. The current season's matches are re-read in full every night for player histories and eligibility, because the CMS shows no sign of what changed and late corrections affect verdicts.

How the matches are downloaded and kept is in ADR 013.
