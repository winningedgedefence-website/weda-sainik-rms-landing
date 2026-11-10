/**
 * Central configuration. Every secret is read from the environment.
 * Nothing in this file is ever sent to the browser except RAZORPAY_KEY_ID,
 * which is a public identifier by design.
 */

// The demo registration fee is FIXED on the server. The browser cannot change it.
export const DEMO_FEE_PAISE = 50000;          // Rs 500.00
export const CURRENCY = "INR";

export const MODE = (process.env.RAZORPAY_MODE || "test").toLowerCase(); // "test" | "live"

export const KEY_ID =
  MODE === "live" ? process.env.RAZORPAY_LIVE_KEY_ID : process.env.RAZORPAY_TEST_KEY_ID;

export const KEY_SECRET =
  MODE === "live" ? process.env.RAZORPAY_LIVE_KEY_SECRET : process.env.RAZORPAY_TEST_KEY_SECRET;

export const WEBHOOK_SECRET =
  MODE === "live" ? process.env.RAZORPAY_LIVE_WEBHOOK_SECRET : process.env.RAZORPAY_TEST_WEBHOOK_SECRET;

export const isConfigured = () => Boolean(KEY_ID && KEY_SECRET);

/** Optional: forward every enquiry / confirmed registration to a sheet, CRM or Zapier hook. */
export const NOTIFY_URL = process.env.NOTIFY_WEBHOOK_URL || "";

export const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*";

export function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");
}

export function fail(res, status, code, message) {
  res.status(status).json({ ok: false, code, message });
}
