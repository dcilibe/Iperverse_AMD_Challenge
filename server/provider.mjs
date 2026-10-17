import { mockWorld, validateWorld } from "./world.mjs";

export function providerStatus(env = process.env) {
  const required = ["AMD_API_KEY", "AMD_BASE_URL", "AMD_MODEL"];
  const supplied = required.filter(k => !!env[k]).length;
  return supplied === 3
    ? { provider: "amd-configured", configured: true }
    : supplied === 0
      ? { provider: "simulator", configured: false }
      : { provider: "incomplete-config", configured: false };
}
function parseModelJSON(content) {
  if (typeof content !== "string") throw new Error("Missing model response");
  const cleaned = content.trim().replace(/^\`\`\`(?:json)?\s*/i, "").replace(/\s*\`\`\`$/, "");
  return JSON.parse(cleaned);
}
export async function evolveWithProvider(telemetry, env = process.env) {
  const state = providerStatus(env);
  if (state.provider === "simulator") {
    return { source: "simulator", model: null, latencyMs: 0, world: mockWorld(telemetry) };
  }
  if (!state.configured) throw new Error("AMD inference configuration is incomplete");
  let url;
  try {
    const base = env.AMD_BASE_URL.endsWith("/") ? env.AMD_BASE_URL : env.AMD_BASE_URL + "/";
    url = new URL("chat/completions", base);
    if (url.protocol !== "https:" && !(url.hostname === "localhost" || url.hostname === "127.0.0.1")) {
      throw new Error("Non-HTTPS AMD endpoint");
    }
  } catch {
    throw new Error("Invalid AMD_BASE_URL; provide an HTTPS OpenAI-compatible /v1/ base URL");
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  const start = Date.now();
  try {
    const response = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Authorization": "Bearer " + env.AMD_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: env.AMD_MODEL,
        temperature: 0.6,
        max_tokens: 180,
        messages: [
          { role: "system", content: "You are a game world director. Output ONLY one JSON object with keys seed (integer), biome (neon,forest,desert,ice), strategy (rush,flank,ambush,swarm), density (2..9), obstacleCount (4..24), narrative (<=120 characters). Choose an adaptive strategy based on player style. Never return executable code or URLs." },
          { role: "user", content: JSON.stringify(telemetry) }
        ]
      })
    });
    if (!response.ok) throw new Error("AMD request failed: HTTP " + response.status);
    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content;
    const raw = parseModelJSON(content);
    return {
      source: "amd",
      model: env.AMD_MODEL,
      latencyMs: Date.now() - start,
      world: validateWorld(raw, telemetry)
    };
  } finally {
    clearTimeout(timeout);
  }
}
