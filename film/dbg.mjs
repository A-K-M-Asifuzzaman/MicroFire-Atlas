import { chromium } from "playwright";
const b = await chromium.launch(); const p = await b.newPage();
p.on("pageerror", (e) => console.log("ERR", e.message, e.stack?.split("\n").slice(0,3).join(" | ")));
await p.goto("file://" + new URL("./build/film.html", import.meta.url).pathname, { waitUntil: "load" });
await b.close();
