import { useEffect, useState } from "react";
import { returnCouponConfig } from "../data/siteData.js";

const DAY = 86400000;

export function useReturnVisitor() {
  const [couponVisible, setCouponVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!returnCouponConfig.enabled) return;
    const now = Date.now();
    const lastVisit = Number(localStorage.getItem("captain7:lastVisit"));
    const dismissedUntil = Number(localStorage.getItem("captain7:returnCouponDismissedUntil"));
    if (dismissedUntil && dismissedUntil > now) {
      localStorage.setItem("captain7:lastVisit", String(now));
      return;
    }
    if (lastVisit && now - lastVisit >= returnCouponConfig.thresholdDays * DAY) {
      setCouponVisible(true);
    }
    localStorage.setItem("captain7:lastVisit", String(now));
  }, []);

  const dismiss = () => {
    localStorage.setItem(
      "captain7:returnCouponDismissedUntil",
      String(Date.now() + returnCouponConfig.thresholdDays * DAY)
    );
    setCouponVisible(false);
  };

  const copy = async () => {
    await navigator.clipboard.writeText(returnCouponConfig.couponCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return { couponVisible, dismiss, copy, copied, config: returnCouponConfig };
}
