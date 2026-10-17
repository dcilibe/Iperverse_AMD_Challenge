import test from "node:test";
import assert from "node:assert/strict";
import {
  WIDTH, HEIGHT, INITIAL_WORLD, seededRandom, makeObstacles,
  collideCircle, moveInside, tacticalDirection, spawnEnemy
} from "../public/game-core.js";

test("seeded world produces repeatable maps", () => {
  assert.deepEqual(makeObstacles(INITIAL_WORLD), makeObstacles(INITIAL_WORLD));
});
test("obstacles never overlap starting player", () => {
  const obstacles = makeObstacles(INITIAL_WORLD);
  assert.ok(obstacles.length > 0);
  assert.ok(obstacles.every(o => Math.hypot(o.x - WIDTH / 2, o.y - HEIGHT / 2) > o.r + 14));
});
test("player cannot move into obstacle or out of bounds", () => {
  const player = { x: 50, y: 50 };
  moveInside(player, -999, -999, [], 14);
  assert.deepEqual(player, { x: 22, y: 22 });
  const p2 = { x: 40, y: 40 };
  moveInside(p2, 80, 0, [{ x: 80, y: 40, r: 25 }], 14);
  assert.equal(p2.x, 40);
});
test("strategic NPC styles are differentiable", () => {
  const enemy = { x: 100, y: 100, id: 2 };
  const player = { x: 200, y: 100 };
  assert.notDeepEqual(tacticalDirection(enemy, player, "rush"), tacticalDirection(enemy, player, "flank"));
});
test("enemy spawning stays within arena and avoids obstacles", () => {
  const random = seededRandom(20);
  const obstacles = makeObstacles(INITIAL_WORLD);
  for (let i = 0; i < 30; i++) {
    const enemy = spawnEnemy(random, i, obstacles);
    assert.ok(enemy);
    assert.ok(enemy.x >= 0 && enemy.x <= WIDTH);
    assert.ok(enemy.y >= 0 && enemy.y <= HEIGHT);
    assert.equal(collideCircle(enemy, enemy.r, obstacles), false);
  }
});
