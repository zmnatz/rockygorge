# Eligibility lives on the USA Club Rugby eligibility site

**Supersedes the eligibility tool in ADRs 008, 010, 011 and 012.** Their rules now live in `@zmnatz/usa-club-rugby-data`.

The eligibility report started here, for Rocky Gorge, and moved into `@zmnatz/usa-club-rugby-data` and the usa-club-rugby-eligibility site, which publishes every USA Club Rugby club's report each night, along with a page for each player, past seasons and a methodology. Keeping a second copy here meant a second set of pages, a nightly `participation.json`, and the components package to keep in step with it.

Decisions, so they are not "fixed" later:

- **No eligibility pages here.** `/utils/eligibility`, `/utils/eligibility-methodology` and the eligibility section of a player page are gone. The menu's Eligibility link goes to Rocky Gorge's report on that site, `https://usa-club-rugby-eligibility.netlify.app/club/rocky-gorge/`.
- **Old links redirect there** (`netlify.toml`): `/utils/eligibility?club=<key>` goes to that club's page, since both sites key clubs by the data package's `clubKey`. `/utils/eligibility` with no club goes to Rocky Gorge's, and the methodology to the site's methodology page.
- **Player pages keep their history.** A player page still shows their games and scores from the match archive. Only the current-season verdicts are gone.
- **The data package stays; the components package goes.** The scripts, crests and match centre still use the data package for team names, divisions and results. No screen here uses the components package.
- **The nightly job no longer writes `participation.json`.** Nothing here reads it. The player histories and the match archive are unchanged.
