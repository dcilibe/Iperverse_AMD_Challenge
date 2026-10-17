import test from "node:test";
import assert from "node:assert/strict";
import { sanitizeTelemetry, validateWorld, mockWorld } from "../server/world.mjs";
import { providerStatus } from "../server/provider.mjs";

test("telemetry rejects malformed seed", () => {
  assert.throws(() => sanitizeTelemetry({ seed: -1, level: 1 }));
  assert.throws(() => sanitizeTelemetry({ seed: 1, level: 0 }));
});
test("telemetry clamps numeric values and unknown style", () => {
  const t = sanitizeTelemetry({ seed: 2, level: 1, hp: 200, kills: -9, style: "hack" });
  assert.equal(t.hp, 100);
  assert.equal(t.kills, 0);
  assert.equal(t.style, "explorer");
});
test("simulator produces distinct strategies based on play style", () => {
  const a = mockWorld(sanitizeTelemetry({ seed: 50, level: 2, style: "aggressive" }));
  const b = mockWorld(sanitizeTelemetry({ seed: 50, level: 2, style: "defensive" }));
  assert.notEqual(a.strategy, b.strategy);
  assert.notEqual(a.biome, b.biome);
});
test("validateWorld rejects unknown biomes, normalizes bounds", () => {
  const t = sanitizeTelemetry({ seed: 3, level: 2 });
  assert.throws(() => validateWorld({ biome: "javascript", strategy: "rush" }, t));
  const world = validateWorld({ biome: "ice", strategy: "swarm", density: 999, obstacleCount: 100, narrative: "<hello>" }, t);
  assert.equal(world.density, 9);
  assert.equal(world.obstacleCount, 24);
  assert.equal(world.narrative, "hello");
});
test("provider status never mistakes partial config for real AMD", () => {
  assert.equal(providerStatus({}).provider, "simulator");
  assert.equal(providerStatus({ AMD_API_KEY: "key" }).provider, "incomplete-config");
  assert.equal(providerStatus({ AMD_API_KEY: "key", AMD_BASE_URL: "https://example.com/v1", AMD_MODEL: "a" }).provider, "amd-configured");
});
