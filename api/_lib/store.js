/**
 * Storage for registrations and enquiries.
 *
 * STORE_DRIVER=memory   (default) in-process only. Fine for local testing.
 *                        On serverless hosting this does NOT survive between
 *                        invocations - use upstash in production.
 * STORE_DRIVER=file     writes .data/*.json next to the project. Good for a VPS.
 * STORE_DRIVER=upstash  Upstash Redis REST. Recommended on Vercel.
 *                        Needs UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.
 *
 * Whatever the driver, a confirmed payment is also pushed to NOTIFY_WEBHOOK_URL
 * if one is set, so the academy always has a durable copy.
 */
import { promises as fs } from "fs";
import path from "path";

const DRIVER = (process.env.STORE_DRIVER || "memory").toLowerCase();
const DIR = process.env.STORE_DIR || path.join(process.cwd(), ".data");
const mem = new Map();

const UP_URL = process.env.UPSTASH_REDIS_REST_URL;
const UP_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

async function upstash(command) {
  const res = await fetch(UP_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${UP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(command)
  });
  if (!res.ok) throw new Error(`Upstash error ${res.status}`);
  return (await res.json()).result;
}

export async function put(key, value) {
  const json = JSON.stringify(value);
  if (DRIVER === "upstash") return void (await upstash(["SET", key, json]));
  if (DRIVER === "file") {
    await fs.mkdir(DIR, { recursive: true });
    return fs.writeFile(path.join(DIR, `${key}.json`), json, "utf8");
  }
  mem.set(key, json);
}

export async function get(key) {
  let json = null;
  if (DRIVER === "upstash") json = await upstash(["GET", key]);
  else if (DRIVER === "file") {
    try { json = await fs.readFile(path.join(DIR, `${key}.json`), "utf8"); }
    catch { json = null; }
  } else json = mem.get(key) ?? null;
  return json ? JSON.parse(json) : null;
}

/** Forward a record to the academy's sheet / CRM. Never throws into the request path. */
export async function notify(kind, record) {
  const url = process.env.NOTIFY_WEBHOOK_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, at: new Date().toISOString(), ...record })
    });
  } catch (e) {
    console.error("[notify] failed:", e.message);
  }
}

/** WEDA-6TH-7K2M9Q style reference, readable over the phone. */
export function reference(prefix) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `WEDA-${prefix}-${s}`;
}
