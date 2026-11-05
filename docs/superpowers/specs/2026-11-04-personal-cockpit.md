# Personal cockpit

The user approved the dark digital-cockpit visual on 2026-11-04: graphite surfaces, restrained cyan accents, compact navigation, a dominant learning/planning surface, tasks and notes on the right, and a website/tool dock below. This records that approved design, rather than introducing a different visual direction.

## Intent and scope

A Chinese personal workspace for learning, plans, tasks, notes, frequently used websites, and experiments. Five directions organize work: investment/options, AI tools/frontier, open-source governance, AI-assisted learning, and personal/family life. They are filters, not financial performance metrics.

The first implementation is a functional static site. Projects have editable steps and derived completion, plans move through next/active/done, tasks can be completed, notes can be captured, websites can be added, and experiments can hold descriptions and optional HTTP(S) links. Search and direction filters apply to recorded work. The tools are a focus timer, text statistics, and JSON formatting/validation.

Data stays in this browser. Provide validated JSON export/import, explicit confirmation before replacement/deletion, recoverable handling of corrupt storage, and an unmistakable warning if persistence fails. Initial illustrative content is labeled and can be removed without removing the user's additions. No implied cloud sync, model API integration, financial results, or execution of arbitrary experiment code.

## Approaches

- Strategic relationship map: explored and rejected as the main interface.
- Light modular dashboard: explored and rejected visually.
- Dark cockpit: chosen by the user after seeing the generated visual. Implement the approved hierarchy, with responsive stacking on smaller screens.

## Implementation decisions

Retain direct GitHub Pages delivery using HTML, CSS and native JavaScript modules; no new build or framework dependency is necessary. Use system fonts and inline SVG icons so the interface does not depend on blocked third-party assets. Keep the existing isolated cloud checkout, with a feature branch and no extra worktree. AI/ima integration, accounts, cross-device sync and live market data are out of scope.

## Acceptance

The desktop view follows the approved composition. Core records survive refresh, backups restore data, invalid backups cannot replace current data, and storage errors do not silently discard data. User text renders as text, website URLs reject unsafe schemes, all controls work with keyboard navigation, and widths down to 390px have no horizontal page overflow.
