const text = (v, max = 80) => typeof v === "string" && v.trim().length > 0 && v.trim().length <= max;
const clean = v => String(v ?? "").trim().replace(/\s+/g, " ").slice(0, 120);

export const isMobile = v => /^[6-9]\d{9}$/.test(String(v || "").trim());
export const isEmail  = v => !String(v || "").trim() || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim());

/** Demo registration payload. Returns {ok, data} or {ok:false, message}. */
export function registration(body = {}) {
  const d = {
    parentName:   clean(body.parentName),
    studentName:  clean(body.studentName),
    mobile:       String(body.mobile || "").trim(),
    email:        clean(body.email).toLowerCase(),
    targetClass:  String(body.targetClass || "").trim(),
    learningMode: String(body.learningMode || "").trim()
  };
  if (!text(d.parentName))  return { ok: false, message: "Parent's name is required" };
  if (!text(d.studentName)) return { ok: false, message: "Student's name is required" };
  if (!isMobile(d.mobile))  return { ok: false, message: "Enter a valid 10-digit Indian mobile number" };
  if (!isEmail(d.email))    return { ok: false, message: "Enter a valid email address" };
  if (!["6th", "9th"].includes(d.targetClass))            return { ok: false, message: "Target class must be 6th or 9th" };
  if (!["Online", "Offline"].includes(d.learningMode))    return { ok: false, message: "Learning mode must be Online or Offline" };
  return { ok: true, data: d };
}
