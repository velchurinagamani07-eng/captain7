import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db, hasFirebaseConfig } from "../firebase/config.js";

function getSessionId() {
  const key = "captain7:visitorSession";
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const next = crypto.randomUUID?.() || `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  localStorage.setItem(key, next);
  return next;
}

function getBrowser() {
  const ua = navigator.userAgent;
  if (ua.includes("Edg/")) return "Edge";
  if (ua.includes("Chrome/")) return "Chrome";
  if (ua.includes("Firefox/")) return "Firefox";
  if (ua.includes("Safari/")) return "Safari";
  return "Other";
}

export async function trackPageView(path) {
  if (!hasFirebaseConfig || !db || typeof window === "undefined") return;

  await addDoc(collection(db, "pageViews"), {
    path,
    timestamp: serverTimestamp(),
    deviceType: window.innerWidth < 768 ? "mobile" : "desktop",
    browser: getBrowser(),
    referrer: document.referrer || "",
    sessionId: getSessionId(),
    userAgent: navigator.userAgent
  }).catch(() => null);
}
