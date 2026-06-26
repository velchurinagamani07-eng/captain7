import { useEffect, useMemo, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { brand } from "../data/siteData.js";
import { db, hasFirebaseConfig } from "../firebase/config.js";

export function useSettingDoc(docId, fallback = {}) {
  const [data, setData] = useState(fallback);
  const [loading, setLoading] = useState(Boolean(hasFirebaseConfig && db));
  const fallbackKey = useMemo(() => JSON.stringify(fallback), [fallback]);

  useEffect(() => {
    if (!hasFirebaseConfig || !db) {
      setData(JSON.parse(fallbackKey));
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    return onSnapshot(
      doc(db, "settings", docId),
      (snapshot) => {
        setData(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : JSON.parse(fallbackKey));
        setLoading(false);
      },
      () => {
        setData(JSON.parse(fallbackKey));
        setLoading(false);
      }
    );
  }, [docId, fallbackKey]);

  return { data, loading };
}

export function useReviewUrl() {
  const { data: general } = useSettingDoc("general", { reviewUrl: brand.reviewUrl });
  const { data: apiKeys } = useSettingDoc("apiKeys", {});

  return general.reviewUrl || apiKeys.googleReviewUrl || brand.reviewUrl;
}

export function useHeroImage(pageKey, fallbackImage) {
  const { data } = useSettingDoc("heroImages", {});
  return data[pageKey] || fallbackImage;
}

export function useWhatsAppSettings() {
  const { data } = useSettingDoc("whatsapp", {
    ownerNumber: brand.whatsappNumber,
    newOrderTemplate:
      "New Captain 7 food order #{orderId}. Name: {customerName}. Phone: {customerPhone}. Address: {address}. Items: {items}. Total: {total}.",
    deliveredReceiptTemplate:
      "Captain 7 Receipt\n\nOrder ID: #{orderId}\n\nItems: {items}\n\nSubtotal: {subtotal}\n\nGST: {gst}\n\nTotal: {total}\n\nDelivered by: {workerName}\n\nThank you for ordering from Captain 7!"
  });

  return data;
}
