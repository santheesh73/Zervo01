/**
 * Helpers to queue SMS jobs in Realtime DB (sms_queue) for a server/Cloud Function
 * or Firebase Extension (e.g. Twilio) to deliver to mobile numbers.
 * Client cannot send SMS directly without exposing API secrets.
 */
import { ref, push, set } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

/** Returns digits-only string with at least 10 digits, or null */
export function normalizePhone(raw) {
  if (raw == null || raw === "") return null;
  const digits = String(raw).replace(/\D/g, "");
  if (digits.length < 10) return null;
  return digits;
}

/**
 * Write one outbound SMS job. Fails silently if rules block sms_queue (in-app notif still works).
 */
export async function queueSms(db, { toDigits, body, userUid, type, extra }) {
  if (!toDigits) return;
  const jobRef = push(ref(db, "sms_queue"));
  const payload = {
    id: jobRef.key,
    to: toDigits,
    body: String(body).slice(0, 480),
    userUid: userUid || null,
    type: type || "generic",
    status: "pending",
    createdAt: Date.now(),
    ...(extra && typeof extra === "object" ? extra : {}),
  };
  try {
    await set(jobRef, payload);
  } catch (e) {
    console.warn("SMS queue write skipped or failed:", e?.message || e);
  }
}
