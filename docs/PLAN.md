# ACT III build plan

## Scope and order
P0 (first): playable 2D top-down arena; keyboard controls; survival and attacks; adaptive rounds; backend endpoint; honest simulator mode; Node tests. This is the bootstrap delivered in the first commit.
P1 (before submission): verify real AMD endpoint and credits, enable model inference, record proof of use; two distinct evolving outcomes; record short demo and publish reachable HTTPS build.
P1: audio/UI polish, mobile controls and manual gameplay balancing. Freeze core before deadline.
P2 (only after stable demo): WebXR/Quest prototype and shared world state; headset QA is mandatory.

## Evidence for judges
Show identical initial seed, two player styles -> distinct model directives and subsequent NPC strategies/level environments. Record AMD model endpoint and valid response. Track inference latency and any per-call cost estimate with source, rather than inventing measurements.

## Acceptance criteria
- npm test / npm run check succeed.
- Browser displays arena and HUD; player moves with arrows/WASD, Space attacks, E triggers a stage evolution.
- Automatic evolution after progression/time.
- Simulator is visibly labelled; configured AMD failures are visible, not silently replaced by fake inference.
- No proprietary code, branding, secret keys or outside backend dependencies in public repo.
- Document submission requirements, originality and license compatibility before publishing.

## Submission checklist
- Confirm exact hackathon submission time in authenticated dashboard.
- Working demo URL over HTTPS, no restricted credentials.
- Public source under MIT, attribution for external dependencies/assets if later added.
- 1–2-minute feature/demo recording, architecture diagram, proof of AMD execution.
- Team membership, project entry and track selected.
