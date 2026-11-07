# Eligibility covers one-side clubs, and links out through the CMS

_The Rugby Xplorer link decisions below are current. The side rules are replaced by ADR 012, and where histories come from by ADR 013._

This replaces "exactly two sides" and the "Which clubs" decision in ADR 010; its other decisions stand. The eligibility tool now lists clubs with one or two sides. A one-side club has only an upper side, whatever its division, because the upper side's rule is the one that applies: two NCS Qualifying Matches at any level (Reg 3.4.2(d) in the 2025-26 regulations, 3.4.2(e) in 2026-27), with fixtures still to play counted as on track. The two-side rules (lower-division minimum, four-game cap, `md3 >= md1`) don't apply, as there's no other side. "One side" means one side in the fixture lists, so a club whose other side plays outside them is treated as one-side and the page says so. ADR 012 replaces the limit on sides and the rule's basis.

Rugby Xplorer links exist so a verdict can be checked against the source, round by round. Decisions, so they are not "fixed" later:

- **Match links**: CMS fixture ids are Rugby Xplorer's, and a report loads under any entity's path, so a match link never needs a lookup. It uses the team's club, or the Capital union if that club's page is unknown.
- **Club links**: `xplorer.rugby` blocks automated clients, so slugs come from the CMS, never the site. Each candidate slug, from `sites` or built from the club's name, is confirmed with `entityDetails(slug)`: by the entity id in the club's crest URL when it has one, otherwise by club name. A club with no confirmed slug links to Rugby Xplorer's front page and says so, since a wrong link is worse than a generic one. A confirmed page is looked up again every 30 days, and an unconfirmed club every 7, so most nights make no lookups.
- **Separate snapshot**: slugs are `public/data/club-pages.json`, not part of `participation.json`, so adding them doesn't regenerate every player file.
- **Club crests**: fixtures often carry the CMS's generic placeholder even when the club has a real crest, so the same lookup keeps the club's crest and the `Crest` component uses it for any side of that club. It covers every season's clubs. Men's and women's clubs stay separate. The list is bundled, not fetched, so a crest never flashes as initials first.
- **Round codes**: record rows key `rounds` by fixture id, not round name, because a team can have two fixtures named "Round 4", and then a player's rounds wouldn't add up to their total.
- **Player page**: `/player` shows the verdict from the nightly snapshot with no live pull, so it can lag the eligibility page by a day.
- **Whole-league histories**: player histories and the record cover every side, competition and season in the standings snapshot's fixtures, so every player in the record has a page. This replaces ADR 010's note that history files only cover Rocky Gorge's competitions. ADR 013 covers how the matches are downloaded and kept.
