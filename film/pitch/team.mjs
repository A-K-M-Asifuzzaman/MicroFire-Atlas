// team.json -> build/team.js (window.__TEAM), with photos embedded as data URLs so the recording needs no server.
// members: [{ "name": "…", "role": "…", "photo": "photos/name.jpg" }]   (photo optional, path relative to this folder)
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { extname } from "node:path";
const t = JSON.parse(readFileSync("team.json", "utf8"));
const mime = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };
for (const m of t.members ?? []) if (m.photo && !m.photo.startsWith("data:")) m.photo = `data:${mime[extname(m.photo).toLowerCase()] ?? "image/jpeg"};base64,${readFileSync(m.photo).toString("base64")}`;
mkdirSync("build", { recursive: true });
writeFileSync("build/team.js", `window.__TEAM = ${JSON.stringify(t)};`);
console.log(`team: ${t.name}, ${(t.members ?? []).length} members`);
