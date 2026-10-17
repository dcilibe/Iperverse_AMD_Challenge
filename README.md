# Evolving Arena — AMD AI World Director

A new, independent browser game created for **AMD Developer Hackathon ACT III**. Current scope: playable 2D arena with adaptive enemy tactics and AI-driven world evolution. Standard desktop first; optional WebXR comes later.

## Quick start

Requires Node.js 20 or later; no npm dependencies.

```sh
npm start
# open http://127.0.0.1:3000
npm test
npm run check
```

Controls: **WASD / arrow keys** move, **Space / mouse click** creates a pulse attack, **E** requests a new AI world directive. Progression also triggers evolution automatically. Each AI directive modifies the biome, NPC strategy, density and map obstacles.

### Model integration

Without credentials the game uses a **clearly marked local simulator**; it is NOT AMD GPU inference.

For real inference, obtain access and an endpoint/model confirmed to support an OpenAI-compatible chat completions request from the hackathon AMD tooling. Environment variables (see `.env.example`):

```sh
export AMD_API_KEY="YOUR_KEY"
export AMD_BASE_URL="https://YOUR_CONFIRMED_PROVIDER/v1/"
export AMD_MODEL="YOUR_CONFIRMED_MODEL"
npm start
```

On Windows PowerShell: `$env:AMD_API_KEY='...'`, etc. Do not commit real keys. The service reports the provider on `/api/health`; **only successful remote calls** are marked `amd` in the game. An AMD request failure is visible and will not silently be simulated.

The server exposes same-origin `POST /api/world/evolve` with a strict validated world schema. See [architecture](docs/ARCHITECTURE.md) and [build plan](docs/PLAN.md).

## Scope / contributors

The project is standalone, MIT licensed, and does not import code or assets from other repositories. Public illustrations are procedurally drawn with Canvas2D. Agent instructions: [AGENTS.md](AGENTS.md); development lead: [Flynn](.github/agents/v2/Flynn-Lead-Game-Developer-v2.chatmode.md), plus AMD, world generation, QA and later XR specialists.

**Status:** new 2D prototype and API scaffold; not yet a deployed demo. Actual AMD account credentials, cloud-model compatibility, public deployment and Quest/VR headset testing remain to be completed.
