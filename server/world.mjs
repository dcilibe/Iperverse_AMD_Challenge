// Safe, versioned contract. Never execute code or download URLs returned by a model.
export const BIOMES = Object.freeze(["neon", "forest", "desert", "ice"]);
export const STRATEGIES = Object.freeze(["rush", "flank", "ambush", "swarm"]);

function numberBetween(n, min, max, fallback) {
  return typeof n === "number" && Number.isFinite(n)
    ? Math.max(min, Math.min(max, n))
    : fallback;
}
function integerBetween(n, min, max, fallback) {
  return Math.round(numberBetween(n, min, max, fallback));
}
function record(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}
export function sanitizeTelemetry(input) {
  if (!record(input)) throw new TypeError("Expected a JSON object");
  if (!Number.isInteger(input.seed) || input.seed < 0 || input.seed > 2147483647) {
    throw new TypeError("seed must be an integer between 0 and 2147483647");
  }
  if (!Number.isInteger(input.level) || input.level < 1 || input.level > 100) {
    throw new TypeError("level must be 1..100");
  }
  return {
    seed: input.seed,
    level: input.level,
    kills: integerBetween(input.kills, 0, 10000, 0),
    hp: integerBetween(input.hp, 0, 100, 100),
    elapsed: integerBetween(input.elapsed, 0, 36000, 0),
    style: ["aggressive", "defensive", "explorer"].includes(input.style)
      ? input.style : "explorer"
  };
}
export function validateWorld(data, telemetry) {
  if (!record(data)) throw new TypeError("AI world directive is not an object");
  if (!BIOMES.includes(data.biome)) throw new TypeError("Invalid biome");
  if (!STRATEGIES.includes(data.strategy)) throw new TypeError("Invalid strategy");
  const narrative = typeof data.narrative === "string"
    ? data.narrative.replace(/[<>]/g, "").slice(0, 160)
    : "The arena changes around you.";
  return {
    version: 1,
    seed: integerBetween(data.seed, 0, 2147483647, telemetry.seed + telemetry.level),
    biome: data.biome,
    strategy: data.strategy,
    density: integerBetween(data.density, 2, 9, 5),
    obstacleCount: integerBetween(data.obstacleCount, 4, 24, 12),
    narrative
  };
}
export function mockWorld(t) {
  const styleIndex = ["aggressive", "defensive", "explorer"].indexOf(t.style);
  const index = Math.max(0, styleIndex);
  const biome = BIOMES[(t.level + index) % BIOMES.length];
  const strategy = { aggressive: "ambush", defensive: "rush", explorer: "flank" }[t.style];
  return validateWorld({
    seed: (t.seed + t.level * 7919 + index * 811) % 2147483647,
    biome, strategy,
    density: Math.min(9, 3 + t.level + (index === 0 ? 2 : 0)),
    obstacleCount: 7 + ((t.level * 3 + index) % 12),
    narrative: {
      aggressive: "Your attacks drew out an ambush. Watch your flanks.",
      defensive: "Your caution triggered a relentless enemy charge.",
      explorer: "Your exploration awakened roaming flankers."
    }[t.style]
  }, t);
}
