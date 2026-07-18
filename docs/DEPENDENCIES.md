# Third-party dependency record

Checked on 18 July 2026 from installed package metadata after `npm ci`. Exact
resolved versions and integrity hashes remain authoritative in `package-lock.json`.

## Runtime packages

| Package | Resolved version | License |
|---|---:|---|
| `openai` | 6.48.0 | Apache-2.0 |
| `react` | 19.2.7 | MIT |
| `react-dom` | 19.2.7 | MIT |
| `zod` | 4.4.3 | MIT |

## Build and test packages

Direct development dependencies resolve to MIT or Apache-2.0. This includes
Playwright (Apache-2.0), TypeScript (Apache-2.0), Testing Library (MIT), jsdom
(MIT), oxlint (MIT), Vite (MIT), and Vitest (MIT). Transitive package notices
remain distributed inside their npm packages and are represented by the lockfile.

## Fonts and visual assets

The page requests Bricolage Grotesque and IBM Plex Sans/Mono from Google Fonts.
Both families are offered under SIL Open Font License 1.1:

- [Bricolage Grotesque upstream](https://github.com/ateliertriay/bricolage)
- [IBM Plex license](https://github.com/IBM/plex/blob/master/LICENSE.txt)

Font binaries are not checked into this repository. Product icons and included
visual assets are covered by the human ownership confirmation in `OWNERSHIP.md`.

## Release check

Before submission, rerun:

```bash
npm ci
npm audit --audit-level=high
npm query ':root > *'
```

This file is an engineering inventory, not replacement for upstream license text.
