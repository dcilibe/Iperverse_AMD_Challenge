import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { sanitizeTelemetry } from "./world.mjs";
import { evolveWithProvider, providerStatus } from "./provider.mjs";

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "127.0.0.1";
const staticFiles = new Map([
  ["/", ["../public/index.html", "text/html; charset=utf-8"]],
  ["/index.html", ["../public/index.html", "text/html; charset=utf-8"]],
  ["/style.css", ["../public/style.css", "text/css; charset=utf-8"]],
  ["/main.js", ["../public/main.js", "text/javascript; charset=utf-8"]],
  ["/game-core.js", ["../public/game-core.js", "text/javascript; charset=utf-8"]]
]);
const hits = new Map();
function json(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
  res.end(JSON.stringify(data));
}
async function readJSON(req) {
  if (!(req.headers["content-type"] || "").toLowerCase().startsWith("application/json")) {
    throw Object.assign(new Error("Expected application/json"), { status: 415 });
  }
  let body = "";
  for await (const chunk of req) {
    body += chunk.toString();
    if (body.length > 8192) throw Object.assign(new Error("Payload too large"), { status: 413 });
  }
  try { return JSON.parse(body); }
  catch { throw Object.assign(new Error("Invalid JSON"), { status: 400 }); }
}
const server = createServer(async (req, res) => {
  const pathname = (req.url || "/").split("?")[0];
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-Frame-Options", "DENY");
  if (req.method === "GET" && pathname === "/api/health") {
    return json(res, 200, { status: "ok", ...providerStatus() });
  }
  if (req.method === "POST" && pathname === "/api/world/evolve") {
    const ip = req.socket.remoteAddress || "local";
    const now = Date.now();
    const previous = hits.get(ip) || [];
    const recent = previous.filter(time => now - time < 60000);
    if (recent.length >= 20) return json(res, 429, { error: "Rate limit: retry in a minute" });
    recent.push(now);
    hits.set(ip, recent);
    try {
      const telemetry = sanitizeTelemetry(await readJSON(req));
      const result = await evolveWithProvider(telemetry);
      return json(res, 200, result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      const status = error.status || (error instanceof TypeError || /Invalid JSON|Expected/.test(message) ? 400 : 502);
      console.error("World evolution error:", message.replace(/Bearer\s+\S+/g, "[redacted]"));
      return json(res, status, { error: status === 502 ? "AI evolution unavailable; " + message.slice(0, 120) : message });
    }
  }
  if (req.method === "GET" && staticFiles.has(pathname)) {
    const [relative, type] = staticFiles.get(pathname);
    try {
      const bytes = await readFile(fileURLToPath(new URL(relative, import.meta.url)));
      res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-cache" });
      return res.end(bytes);
    } catch { return json(res, 500, { error: "Asset unavailable" }); }
  }
  return json(res, 404, { error: "Not found" });
});
server.listen(PORT, HOST, () => console.log("Evolving Arena listening on http://" + HOST + ":" + PORT));
