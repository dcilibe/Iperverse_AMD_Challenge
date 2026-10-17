import {
  WIDTH, HEIGHT, INITIAL_WORLD, PALETTES,
  seededRandom, clamp, distance, makeObstacles,
  moveInside, tacticalDirection, spawnEnemy
} from "./game-core.js";

const canvas = document.querySelector("#arena");
const ctx = canvas.getContext("2d");
const $ = id => document.getElementById(id);
let state;
let raf;
const keys = new Set();

function reset() {
  state = {
    world: { ...INITIAL_WORLD }, obstacles: makeObstacles(INITIAL_WORLD),
    player: { x: WIDTH / 2, y: HEIGHT / 2, hp: 100, attackCooldown: 0, attackFx: 0, hurtFx: 0 },
    enemies: [], particles: [], kills: 0, roundKills: 0, level: 1,
    elapsed: 0, roundElapsed: 0, attacks: 0, distanceTravelled: 0,
    spawnTimer: 0, nextEnemy: 1, evolving: false, running: false,
    random: seededRandom(789), last: 0, provider: "unverified", toastTime: 0
  };
  syncHUD();
}
function showToast(message, seconds = 5) {
  $("toast").textContent = message;
  if (state) state.toastTime = seconds;
}
async function loadProvider() {
  try {
    const res = await fetch("/api/health");
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    $("source").textContent = data.provider === "simulator" ? "LOCAL SIMULATOR" : data.provider.toUpperCase();
    $("model").textContent = data.provider === "simulator" ? "No GPU inference yet" : "Test real inference before claiming AMD";
  } catch {
    $("source").textContent = "BACKEND UNAVAILABLE";
    $("model").textContent = "Start npm start";
  }
}
function play() {
  cancelAnimationFrame(raf);
  reset();
  state.running = true;
  $("overlay").classList.add("hidden");
  state.last = performance.now();
  raf = requestAnimationFrame(frame);
}
function gameOver() {
  state.running = false;
  $("overlayTitle").textContent = "THE WORLD OUTLIVED YOU";
  $("overlayDescription").textContent = "You survived " + Math.floor(state.elapsed) + " seconds and eliminated " + state.kills + " hostiles across " + state.level + " evolving arenas.";
  $("play").textContent = "TRY AGAIN";
  $("overlay").classList.remove("hidden");
}
function playStyle() {
  // A simple, explainable signal for the world director.
  if (state.attacks >= 5 && state.attacks > state.distanceTravelled / 140) return "aggressive";
  if (state.player.hp <= 55 || state.distanceTravelled < 550) return "defensive";
  return "explorer";
}
async function evolve() {
  if (!state.running || state.evolving) return;
  state.evolving = true;
  showToast("AI World Director is analyzing your strategy…", 12);
  const telemetry = {
    seed: state.world.seed, level: Math.min(100, state.level + 1),
    kills: state.kills, hp: Math.round(state.player.hp),
    elapsed: Math.floor(state.elapsed), style: playStyle()
  };
  const started = performance.now();
  try {
    const result = await fetch("/api/world/evolve", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(telemetry)
    });
    const payload = await result.json();
    if (!result.ok) throw new Error(payload.error || "Unexpected API response");
    if (!PALETTES[payload.world?.biome]) throw new Error("Invalid world directive");
    if (!["rush", "flank", "ambush", "swarm"].includes(payload.world.strategy)) throw new Error("Invalid NPC strategy");
    state.level++;
    state.world = payload.world;
    state.obstacles = makeObstacles(state.world);
    state.enemies = [];
    state.player.x = WIDTH / 2;
    state.player.y = HEIGHT / 2;
    state.player.hp = clamp(state.player.hp + 25, 0, 100);
    state.roundElapsed = 0;
    state.roundKills = 0;
    state.spawnTimer = 0;
    state.attacks = 0;
    state.distanceTravelled = 0;
    state.random = seededRandom(state.world.seed + 123);
    state.provider = payload.source;
    $("source").textContent = payload.source === "amd" ? "AMD GPU INFERENCE" : "LOCAL SIMULATOR";
    $("model").textContent = payload.source === "amd" ? payload.model : "NOT AMD — demonstration only";
    $("latency").textContent = Math.round(payload.latencyMs || (performance.now() - started)) + " ms";
    showToast(payload.world.narrative, 8);
    syncHUD();
  } catch (error) {
    showToast("AI request failed: " + String(error.message || error).slice(0, 85) + ". Arena unchanged.", 8);
    $("info").textContent = "AI backend error; no inferred evolution applied";
  } finally {
    state.evolving = false;
  }
}
function attack() {
  if (!state.running || state.player.attackCooldown > 0) return;
  const p = state.player;
  p.attackCooldown = 0.55;
  p.attackFx = 0.2;
  state.attacks++;
  for (const enemy of state.enemies) {
    if (distance(enemy, p) <= 95) {
      enemy.health--;
      const dx = enemy.x - p.x, dy = enemy.y - p.y, d = Math.max(1, Math.hypot(dx, dy));
      moveInside(enemy, dx / d * 23, dy / d * 23, state.obstacles, enemy.r);
      state.particles.push({ x: enemy.x, y: enemy.y, ttl: 0.4 });
    }
  }
}
function syncHUD() {
  if (!state) return;
  $("hp").textContent = Math.max(0, Math.ceil(state.player.hp));
  $("kills").textContent = state.kills;
  $("level").textContent = String(state.level).padStart(2, "0");
  $("strategy").textContent = state.world.strategy.toUpperCase();
  $("biome").textContent = state.world.biome.toUpperCase();
  $("worldLabel").textContent = "WORLD " + String(state.level).padStart(2, "0") + " · " + state.world.biome.toUpperCase() + " SECTOR";
}
function update(dt) {
  const p = state.player;
  state.elapsed += dt;
  state.roundElapsed += dt;
  p.attackCooldown = Math.max(0, p.attackCooldown - dt);
  p.attackFx = Math.max(0, p.attackFx - dt);
  p.hurtFx = Math.max(0, p.hurtFx - dt);
  state.toastTime -= dt;
  if (state.toastTime <= 0) $("toast").textContent = "SPACE / CLICK: pulse · E: AI evolve";
  let dx = Number(keys.has("d") || keys.has("arrowright")) - Number(keys.has("a") || keys.has("arrowleft"));
  let dy = Number(keys.has("s") || keys.has("arrowdown")) - Number(keys.has("w") || keys.has("arrowup"));
  const mag = Math.hypot(dx, dy) || 1;
  dx = dx / mag * 245 * dt; dy = dy / mag * 245 * dt;
  const previous = { x: p.x, y: p.y };
  moveInside(p, dx, dy, state.obstacles, 14);
  state.distanceTravelled += distance(previous, p);
  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0 && state.enemies.length < 30) {
    const e = spawnEnemy(state.random, state.nextEnemy++, state.obstacles);
    if (e) state.enemies.push(e);
    state.spawnTimer = Math.max(0.35, 1.9 - state.world.density * 0.13);
  }
  for (const e of state.enemies) {
    const direction = tacticalDirection(e, p, state.world.strategy, state.elapsed + e.phase);
    const speed = state.world.strategy === "rush" ? 105 : 89;
    moveInside(e, direction.x * speed * dt, direction.y * speed * dt, state.obstacles, e.r);
    if (distance(e, p) < e.r + 14 && p.hurtFx <= 0) {
      p.hp -= 9;
      p.hurtFx = 0.7;
    }
  }
  state.enemies = state.enemies.filter(e => {
    if (e.health > 0) return true;
    state.kills++; state.roundKills++;
    return false;
  });
  state.particles = state.particles.filter(fx => (fx.ttl -= dt) > 0);
  if (p.hp <= 0) { syncHUD(); gameOver(); return; }
  if (!state.evolving && (state.roundKills >= 10 || state.roundElapsed >= 29)) void evolve();
  syncHUD();
}
function draw() {
  const w = state.world;
  const colors = PALETTES[w.biome];
  ctx.fillStyle = colors.floor; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.strokeStyle = colors.grid; ctx.lineWidth = 1;
  for (let x = 0; x < WIDTH; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, HEIGHT); ctx.stroke(); }
  for (let y = 0; y < HEIGHT; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WIDTH, y); ctx.stroke(); }
  for (const o of state.obstacles) {
    ctx.shadowBlur = 16; ctx.shadowColor = colors.edge;
    ctx.fillStyle = colors.obstacle; ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
    ctx.strokeStyle = colors.edge; ctx.lineWidth = 2; ctx.stroke();
  }
  for (const e of state.enemies) {
    ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(state.elapsed * 0.8 + e.phase);
    ctx.fillStyle = colors.enemy; ctx.shadowColor = colors.enemy; ctx.shadowBlur = 14;
    ctx.fillRect(-9, -9, 18, 18); ctx.shadowBlur = 0; ctx.restore();
  }
  const p = state.player;
  if (p.attackFx > 0) {
    ctx.strokeStyle = "#92f6ff"; ctx.lineWidth = 6 * p.attackFx / 0.2;
    ctx.beginPath(); ctx.arc(p.x, p.y, 95 * (1 - p.attackFx / 0.2), 0, Math.PI * 2); ctx.stroke();
  }
  for (const fx of state.particles) {
    ctx.fillStyle = "#fce69c"; ctx.globalAlpha = clamp(fx.ttl * 2.5, 0, 1);
    ctx.beginPath(); ctx.arc(fx.x, fx.y, 5 + fx.ttl * 20, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
  }
  ctx.fillStyle = p.hurtFx > 0 ? "#ffffff" : "#65e8f6";
  ctx.shadowColor = "#4bedfb"; ctx.shadowBlur = 20;
  ctx.beginPath(); ctx.arc(p.x, p.y, 14, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0; ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke();
  ctx.font = "11px monospace"; ctx.textAlign = "right"; ctx.fillStyle = "#8a9dbb";
  ctx.fillText("TIME " + Math.floor(state.elapsed) + "s", WIDTH - 18, 26);
}
function frame(now) {
  if (!state.running) return;
  const dt = Math.min(0.05, (now - state.last) / 1000 || 0.016);
  state.last = now;
  update(dt);
  draw();
  if (state.running) raf = requestAnimationFrame(frame);
}
window.addEventListener("keydown", event => {
  const key = event.key.toLowerCase();
  if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) event.preventDefault();
  keys.add(key);
  if (key === " ") attack();
  if (key === "e" && !event.repeat) void evolve();
});
window.addEventListener("keyup", event => keys.delete(event.key.toLowerCase()));
window.addEventListener("blur", () => keys.clear());
canvas.addEventListener("pointerdown", () => attack());
$("play").addEventListener("click", play);
reset();
loadProvider();
