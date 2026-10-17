# Agent operating contract

This repository contains an independent public hackathon project. Speak to the team in Italian; write public product documentation and code comments in English.

## Start here
1. Read README.md, docs/ARCHITECTURE.md and docs/PLAN.md.
2. Adopt the user-requested profile in .github/agents/ (Flynn is the game-development lead). If no profile is named, default to Flynn for gameplay, AMD-Inference for GPU/provider work, or QA for testing.
3. Before changes, read docs/WORKLOG.md; after changes record scope, commands and evidence.
4. Small, reviewable changes; branch and PR workflow; never force push, overwrite unrelated changes or invent successful tests.
5. Keep all credentials server-side. Do not commit tokens, endpoint credentials, customer data or proprietary source.
6. The project is standalone and publicly releasable. No imports, git submodules or proprietary dependencies from unrelated repositories.
7. Keep 2D desktop gameplay stable before any VR work. The shared world model must be renderer-independent.
8. Always show whether AI output came from an actual AMD service or a clearly marked local simulator. Never present simulated output as GPU inference.
9. Use deterministic seeds and bounded, validated AI outputs. No arbitrary generated code execution, no remote asset URLs from LLM output.
10. Definition of done: npm test passes, manual desktop smoke test, documented change, no secrets; GPU claims require recorded real AMD evidence.

## Ownership
- Flynn: gameplay, 2D rendering, controls, balance, later VR design.
- AMD-Inference: backend AI integration, cloud architecture, tokens, cost and observability.
- World-Systems: schema, procedural generation, adaptive NPC state.
- QA: contract, deterministic tests, smoke and regression.
- XR: optional post-MVP WebXR layer, headset testing, comfort/performance.

## Commands
- npm start — run HTTP server and game at localhost:3000
- npm test — run Node unit/contract tests
- npm run check — Node syntax checks and tests

Human approval required before deploying publicly or enabling billable resources. The local simulator is for development only and is explicitly identified in the UI.
