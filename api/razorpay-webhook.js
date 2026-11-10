/**
 * Razorpay webhook - the reliable confirmation path.
 * Works even if the parent closes the browser before the handler runs.
 * Configure in the Razorpay dashboard with events:
 *   payment.captured, payment.failed, order.paid
 */
import crypto from "crypto";
import { WEBHOOK_SECRET } from "./_lib/config.js";
import { get, put, notify } from "./_lib/store.js";

// Razorpay signs the RAW body, so the default parser must be off.
export const config = { api: { bodyParser: false } };

const readRaw = req => new Promise((resolve, reject) => {
  const chunks = [];
  req.on("data", c => chunks.push(c));
  req.on("end", () => resolve(Buffer.concat(chunks)));
  req.on("error", reject);
});

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false });
  if (!WEBHOOK_SECRET) {
    console.error("[webhook] no webhook secret configured");
    return res.status(503).json({ ok: false });
  }

  const raw = await readRaw(req);
  const expected = crypto.createHmac("sha256", WEBHOOK_SECRET).update(raw).digest("hex");
  const got = String(req.headers["x-razorpay-signature"] || "");
  const a = Buffer.from(expected, "utf8"), b = Buffer.from(got, "utf8");

  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    console.warn("[webhook] bad signature");
    return res.status(400).json({ ok: false });      // do NOT process unsigned payloads
  }

  let body;
  try { body = JSON.parse(raw.toString("utf8")); }
  catch { return res.status(400).json({ ok: false }); }

  const event   = body.event;
  const payment = body.payload?.payment?.entity;
  const orderId = payment?.order_id || body.payload?.order?.entity?.id;
  if (!orderId) return res.status(200).json({ ok: true, ignored: event });

  const idx = await get(`order:${orderId}`);
  if (!idx) return res.status(200).json({ ok: true, ignored: "unknown order" });

  const record = await get(`reg:${idx.registrationId}`);
  if (!record) return res.status(200).json({ ok: true, ignored: "unknown registration" });

  // Idempotency - Razorpay retries webhooks, we must not double-process.
  const seen = record.webhookEvents || [];
  const eventId = body.payload?.payment?.entity?.id ? `${event}:${payment.id}` : `${event}:${orderId}`;
  if (seen.includes(eventId)) return res.status(200).json({ ok: true, duplicate: true });

  let next = { ...record, webhookEvents: [...seen, eventId], updatedAt: new Date().toISOString() };

  if (event === "payment.captured" || event === "order.paid") {
    if (record.status !== "paid") {
      next = { ...next, status: "paid", paymentId: payment?.id || record.paymentId, verifiedBy: "webhook", paidAt: new Date().toISOString() };
      await put(`reg:${record.registrationId}`, next);
      await notify("demo_registration_paid", next);
      return res.status(200).json({ ok: true, confirmed: true });
    }
  } else if (event === "payment.failed") {
    if (record.status !== "paid") {
      next = { ...next, status: "failed", failureReason: payment?.error_description || "payment_failed" };
    }
  }

  await put(`reg:${record.registrationId}`, next);
  return res.status(200).json({ ok: true });
}
