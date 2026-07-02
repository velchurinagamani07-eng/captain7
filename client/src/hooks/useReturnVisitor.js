import { useEffect, useState } from "react";
import { useDocument } from "./useFirestore.js";
import { returnCouponConfig as fallbackConfig } from "../data/siteData.js";

const DAY = 86400000;

export function useReturnVisitor() {
  const { data: dbConfig, loading } = useDocument("settings/returnCoupon", fallbackConfig);
  const [couponVisible, setCouponVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const config = dbConfig || fallbackConfig;

  useEffect(() => {
    if (loading || !config || !config.enabled) return;
    const now = Date.now();
    const lastVisit = Number(localStorage.getItem("captain7:lastVisit"));
    const dismissedUntil = Number(localStorage.getItem("captain7:returnCouponDismissedUntil"));
    if (dismissedUntil && dismissedUntil > now) {
      localStorage.setItem("captain7:lastVisit", String(now));
      return;
    }
    const thresholdDays = Number(config.thresholdDays) || 3;
    if (lastVisit && now - lastVisit >= thresholdDays * DAY) {
      setCouponVisible(true);
    }
    localStorage.setItem("captain7:lastVisit", String(now));
  }, [loading, config]);

  const dismiss = () => {
    const thresholdDays = Number(config.thresholdDays) || 3;
    localStorage.setItem(
      "captain7:returnCouponDismissedUntil",
      String(Date.now() + thresholdDays * DAY)
    );
    setCouponVisible(false);
  };

  const copy = async () => {
    await navigator.clipboard.writeText(config.couponCode || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return { couponVisible, dismiss, copy, copied, config };
}
