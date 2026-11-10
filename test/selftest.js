/** Self-test: signature verification, validation and the fixed amount. */
import crypto from "crypto";
import { registration, isMobile } from "../api/_lib/validate.js";

let pass = 0, fail = 0;
const t = (name, cond) => { cond ? (pass++, console.log("  ok   " + name)) : (fail++, console.log("  FAIL " + name)); };

console.log("\nMobile validation");
t("accepts 9876543210", isMobile("9876543210"));
t("rejects 1234567890", !isMobile("1234567890"));
t("rejects 98765", !isMobile("98765"));

console.log("\nRegistration validation");
const good = { parentName:"Rajesh Kumar", studentName:"Aarav Kumar", mobile:"9876543210", email:"a@b.com", targetClass:"6th", learningMode:"Online" };
t("accepts a complete payload", registration(good).ok);
t("rejects a bad target class", !registration({...good, targetClass:"7th"}).ok);
t("rejects a bad learning mode", !registration({...good, learningMode:"Hybrid"}).ok);
t("rejects a missing parent name", !registration({...good, parentName:""}).ok);
t("allows an empty email", registration({...good, email:""}).ok);

console.log("\nRazorpay checkout signature (HMAC SHA256 of order_id|payment_id)");
const SECRET = "test_secret_value";
const orderId = "order_TESTabc123", paymentId = "pay_TESTxyz789";
const sig = crypto.createHmac("sha256", SECRET).update(`${orderId}|${paymentId}`).digest("hex");
const check = (o,p,s,secret=SECRET) => {
  const exp = crypto.createHmac("sha256", secret).update(`${o}|${p}`).digest("hex");
  const a = Buffer.from(exp,"utf8"), b = Buffer.from(String(s),"utf8");
  return a.length === b.length && crypto.timingSafeEqual(a,b);
};
t("valid signature passes", check(orderId, paymentId, sig));
t("tampered payment id fails", !check(orderId, "pay_FAKE", sig));
t("tampered order id fails", !check("order_FAKE", paymentId, sig));
t("wrong secret fails", !check(orderId, paymentId, sig, "other_secret"));
t("empty signature fails", !check(orderId, paymentId, ""));

console.log("\nWebhook signature (HMAC SHA256 of the raw body)");
const WSECRET = "webhook_secret_value";
const raw = Buffer.from(JSON.stringify({ event:"payment.captured", payload:{ payment:{ entity:{ id:paymentId, order_id:orderId }}}}));
const wsig = crypto.createHmac("sha256", WSECRET).update(raw).digest("hex");
const wcheck = (buf, s) => {
  const exp = crypto.createHmac("sha256", WSECRET).update(buf).digest("hex");
  const a = Buffer.from(exp,"utf8"), b = Buffer.from(String(s),"utf8");
  return a.length === b.length && crypto.timingSafeEqual(a,b);
};
t("valid webhook signature passes", wcheck(raw, wsig));
t("modified body fails", !wcheck(Buffer.from(raw.toString().replace("captured","failed")), wsig));

console.log("\nFixed amount");
const cfg = await import("../api/_lib/config.js");
t("demo fee is locked at 50000 paise (Rs 500)", cfg.DEMO_FEE_PAISE === 50000);
t("currency is INR", cfg.CURRENCY === "INR");
t("isConfigured() is false without keys", cfg.isConfigured() === false);

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
