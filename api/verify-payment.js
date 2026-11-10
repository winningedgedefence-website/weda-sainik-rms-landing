/**
 * STEP 2 - verify the Razorpay signature on the SERVER.
 * A registration is only ever marked paid after this check passes.
 */
import crypto from "crypto";
import { KEY_SECRET, isConfigured, cors, fail } from "./_lib/config.js";
import { get, put, notify } from "./_lib/store.js";

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return fail(res, 405, "METHOD_NOT_ALLOWED", "Use POST");
  if (!isConfigured()) return fail(res, 503, "NOT_CONFIGURED", "Razorpay is not configured on the server.");

  const {
    razorpay_order_id: orderId,
    razorpay_payment_id: paymentId,
    razorpay_signature: signature,
    registrationId
  } = req.body || {};

  if (!orderId || !paymentId || !signature || !registrationId)
    return fail(res, 400, "INVALID_INPUT", "Missing payment details");

  const record = await get(`reg:${registrationId}`);
  if (!record) return fail(res, 404, "NOT_FOUND", "Registration not found");

  // Idempotent: a repeat call for an already-confirmed payment returns the same result.
  if (record.status === "paid" && record.paymentId === paymentId) {
    return res.status(200).json({ ok: true, reference: record.reference, amount: record.amount, alreadyConfirmed: true });
  }

  // The order id must be the one we created for THIS registration.
  if (record.orderId !== orderId)
    return fail(res, 400, "ORDER_MISMATCH", "This payment does not belong to this registration");

  const expected = crypto
    .createHmac("sha256", KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(String(signature), "utf8");
  const valid = a.length === b.length && crypto.timingSafeEqual(a, b);

  if (!valid) {
    await put(`reg:${registrationId}`, { ...record, status: "failed", failureReason: "signature_mismatch", updatedAt: new Date().toISOString() });
    return fail(res, 400, "SIGNATURE_INVALID", "Payment signature could not be verified");
  }

  const updated = {
    ...record,
    status: "paid",
    paymentId,
    verifiedBy: "checkout_signature",
    paidAt: new Date().toISOString()
  };
  await put(`reg:${registrationId}`, updated);
  await notify("demo_registration_paid", updated);

  return res.status(200).json({ ok: true, reference: updated.reference, amount: updated.amount, paymentId });
}
