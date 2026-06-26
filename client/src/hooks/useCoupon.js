import { coupons } from "../data/siteData.js";

export function calculateDiscount(code, subtotal, applicableTo = "all") {
  const coupon = coupons.find((item) => item.code.toLowerCase() === String(code || "").toLowerCase() && item.active);
  if (!coupon) return { valid: false, discount: 0, message: "Coupon not found" };
  if (coupon.applicableTo !== "all" && coupon.applicableTo !== applicableTo) {
    return { valid: false, discount: 0, message: "Coupon cannot be used here" };
  }
  if (subtotal < coupon.minOrder) {
    return { valid: false, discount: 0, message: `Minimum order is Rs. ${coupon.minOrder}` };
  }
  const discount = coupon.discountType === "percent" ? Math.round((subtotal * coupon.discountValue) / 100) : coupon.discountValue;
  return { valid: true, discount: Math.min(discount, subtotal), message: "Coupon applied" };
}
