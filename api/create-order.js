/**
 * STEP 1 - create a Razorpay order on the SERVER.
 * The amount is set here, never by the browser.
 */
import crypto from "crypto";
import { DEMO_FEE_PAISE, CURRENCY, KEY_ID, KEY_SECRET, MODE, isConfigured, cors, fail } from "./_lib/config.js";
import { put, reference } from "./_lib/store.js";
import { registration } from "./_lib/validate.js";

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return fail(res, 405, "METHOD_NOT_ALLOWED", "Use POST");

  if (!isConfigured()) {
    // Honest failure. We never pretend a payment flow exists when it does not.
    return fail(res, 503, "NOT_CONFIGURED",
      "Razorpay keys are not configured on the server. Set RAZORPAY_TEST_KEY_ID and RAZORPAY_TEST_KEY_SECRET.");
  }

  const v = registration(req.body || {});
  if (!v.ok) return fail(res, 400, "INVALID_INPUT", v.message);
  const data = v.data;

  const registrationId = crypto.randomUUID();
  const receipt = `demo_${Date.now().toString(36)}_${registrationId.slice(0, 8)}`;

  try {
    const rp = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString("base64"),
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: DEMO_FEE_PAISE,
        currency: CURRENCY,
        receipt,
        payment_capture: 1,
        notes: {
          registrationId,
          parentName: data.parentName,
          studentName: data.studentName,
          mobile: data.mobile,
          targetClass: data.targetClass,
          learningMode: data.learningMode,
          programme: "5+1 Day Demo Classes"
        }
      })
    });

    const order = await rp.json();
    if (!rp.ok) {
      console.error("[create-order] razorpay error", order);
      return fail(res, 502, "GATEWAY_ERROR",
        (order && order.error && order.error.description) || "Payment gateway could not create the order");
    }

    await put(`reg:${registrationId}`, {
      registrationId,
      ...data,
      programme: "5+1 Day Demo Classes",
      amount: DEMO_FEE_PAISE,
      currency: CURRENCY,
      mode: MODE,
      orderId: order.id,
      receipt,
      status: "created",          // created -> paid | failed
      paymentId: null,
      reference: reference(data.targetClass.toUpperCase()),
      createdAt: new Date().toISOString()
    });
    // index by order id so the webhook can find the registration
    await put(`order:${order.id}`, { registrationId });

    return res.status(200).json({
      ok: true,
      registrationId,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: KEY_ID            // public key id only - the secret never leaves the server
    });
  } catch (e) {
    console.error("[create-order]", e);
    return fail(res, 500, "SERVER_ERROR", "Could not start the registration. Please try again.");
  }
}
