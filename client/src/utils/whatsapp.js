import { brand } from "../data/siteData.js";
import { db } from "../firebase.js";
import { doc, onSnapshot } from "firebase/firestore";

let cachedOwnerNumber = brand.whatsappNumber;
let cachedReviewUrl = brand.reviewUrl;

if (db) {
  onSnapshot(doc(db, "settings", "whatsapp"), (snapshot) => {
    if (snapshot.exists() && snapshot.data().ownerNumber) {
      cachedOwnerNumber = snapshot.data().ownerNumber;
    }
  }, (err) => console.warn("settings/whatsapp listener failed:", err));

  onSnapshot(doc(db, "settings", "general"), (snapshot) => {
    if (snapshot.exists() && snapshot.data().reviewUrl) {
      cachedReviewUrl = snapshot.data().reviewUrl;
    }
  }, (err) => console.warn("settings/general listener failed:", err));

  onSnapshot(doc(db, "settings", "apiKeys"), (snapshot) => {
    if (snapshot.exists() && snapshot.data().googleReviewUrl) {
      cachedReviewUrl = snapshot.data().googleReviewUrl;
    }
  }, (err) => console.warn("settings/apiKeys listener failed:", err));
}

export function getOwnerWhatsAppNumber() {
  return cachedOwnerNumber || brand.whatsappNumber;
}

export function getReviewUrl() {
  return cachedReviewUrl || brand.reviewUrl;
}

export function whatsappUrl(message, phone) {
  const targetPhone = phone || getOwnerWhatsAppNumber();
  const reviewUrl = getReviewUrl();
  let finalMessage = message;
  if (reviewUrl && !finalMessage.includes("Rate us on Google:")) {
    finalMessage = `${finalMessage}\n\nRate us on Google: ${reviewUrl}`;
  }
  return `https://wa.me/${formatIndianWhatsAppPhone(targetPhone)}?text=${encodeURIComponent(finalMessage)}`;
}

export function openOwnerWhatsApp(message, phone) {
  const targetPhone = phone || getOwnerWhatsAppNumber();
  window.open(whatsappUrl(message, targetPhone), "_blank", "noopener,noreferrer");
}

export function formatIndianWhatsAppPhone(phone = "") {
  const clean = String(phone).replace(/\D/g, "");
  if (!clean) return "";
  if (clean.length === 10) return `91${clean}`;
  if (clean.length === 11 && clean.startsWith("0")) return `91${clean.slice(1)}`;
  if (clean.startsWith("91")) return clean;
  return clean;
}

export function openCustomerWhatsApp(phone, message) {
  const formattedPhone = formatIndianWhatsAppPhone(phone);
  if (!formattedPhone) return;
  const reviewUrl = getReviewUrl();
  let finalMessage = message;
  if (reviewUrl && !finalMessage.includes("Rate us on Google:")) {
    finalMessage = `${finalMessage}\n\nRate us on Google: ${reviewUrl}`;
  }
  window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(finalMessage)}`, "_blank", "noopener,noreferrer");
}

export function withReviewLink(message, reviewUrl) {
  const activeReviewUrl = reviewUrl || getReviewUrl();
  const cleanMessage = String(message || "").trim();
  if (!activeReviewUrl) return cleanMessage;
  if (cleanMessage.includes("Rate us on Google:")) return cleanMessage;
  return `${cleanMessage}\n\nRate us on Google: ${activeReviewUrl}`;
}
