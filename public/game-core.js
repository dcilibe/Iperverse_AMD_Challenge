// Pure simulation helpers shared by the 2D renderer and future renderers.
export const WIDTH = 960;
export const HEIGHT = 560;
export const INITIAL_WORLD = Object.freeze({
  version: 1, seed: 271828, biome: "neon", strategy: "rush",
  density: 4, obstacleCount: 10, narrative: "An unstable world is waking up."
});
export const PALETTES = {
  neon: { floor: "#0a1529", grid: "#152a49", obstacle: "#6454aa", edge: "#ad8dff", enemy: "#ff5279" },
  forest: { floor: "#081e1d", grid: "#174239", obstacle: "#416a4c", edge: "#9ddf86", enemy: "#ff805c" },
  desert: { floor: "#2a1a19", grid: "#60403a", obstacle: "#ae7450", edge: "#ffd08a", enemy: "#ff5365" },
  ice: { floor: "#102333", grid: "#2b5471", obstacle: "#5e9ebb", edge: "#b9f4ff", enemy: "#ff748d" }
};
export function seededRandom(seed) {
  let value = seed >>> 0 || 1;
  return () => {
    value ^= value << 13; value ^= value >>> 17; value ^= value << 5;
    return (value >>> 0) / 4294967296;
  };
}
export function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
export function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
export function makeObstacles(world) {
  const rand = seededRandom(world.seed + 41);
  const result = [];
  for (let attempt = 0; attempt < world.obstacleCount * 16 && result.length < world.obstacleCount; attempt++) {
    const point = { x: 40 + rand() * (WIDTH - 80), y: 45 + rand() * (HEIGHT - 90), r: 18 + rand() * 20 };
    if (distance(point, { x: WIDTH / 2, y: HEIGHT / 2 }) < 135) continue;
    if (result.some(other => distance(other, point) < other.r + point.r + 24)) continue;
    result.push(point);
  }
  return result;
}
export function collideCircle(point, radius, obstacles) {
  return obstacles.some(o => distance(point, o) < o.r + radius);
}
export function moveInside(entity, dx, dy, obstacles, radius) {
  const nextX = clamp(entity.x + dx, radius + 8, WIDTH - radius - 8);
  const xCandidate = { x: nextX, y: entity.y };
  if (!collideCircle(xCandidate, radius, obstacles)) entity.x = nextX;
  const nextY = clamp(entity.y + dy, radius + 8, HEIGHT - radius - 8);
  const yCandidate = { x: entity.x, y: nextY };
  if (!collideCircle(yCandidate, radius, obstacles)) entity.y = nextY;
}
export function tacticalDirection(enemy, player, strategy, time = 0) {
  const dx = player.x - enemy.x, dy = player.y - enemy.y;
  const d = Math.max(1, Math.hypot(dx, dy));
  let vx = dx / d, vy = dy / d;
  if (strategy === "flank") {
    const side = enemy.id % 2 === 0 ? 1 : -1;
    const weight = d > 65 ? 0.8 : 0.15;
    const tangentX = -vy * side, tangentY = vx * side;
    vx = vx * (1 - weight) + tangentX * weight;
    vy = vy * (1 - weight) + tangentY * weight;
  }
  if (strategy === "ambush" && d > 170) {
    vx *= 0.35; vy *= 0.35;
  }
  if (strategy === "swarm") {
    const orbit = Math.sin(time * 1.6 + enemy.id) * 0.55;
    const nx = vx, ny = vy;
    vx = nx - ny * orbit; vy = ny + nx * orbit;
  }
  const mag = Math.max(0.00001, Math.hypot(vx, vy));
  return { x: vx / mag, y: vy / mag };
}
export function spawnEnemy(rand, id, obstacles) {
  for (let tries = 0; tries < 50; tries++) {
    const edge = Math.floor(rand() * 4);
    const x = edge === 0 ? 20 : edge === 1 ? WIDTH - 20 : 20 + rand() * (WIDTH - 40);
    const y = edge === 2 ? 20 : edge === 3 ? HEIGHT - 20 : 20 + rand() * (HEIGHT - 40);
    const point = { x, y, r: 12, id, health: 2, phase: rand() * Math.PI * 2 };
    if (!collideCircle(point, point.r, obstacles)) return point;
  }
  return null;
}
