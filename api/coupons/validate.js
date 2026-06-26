const coupons = [
  { code: "CAPTAIN20", discountType: "percent", discountValue: 20, minOrder: 299, applicableTo: "all", active: true },
  { code: "PLAY100", discountType: "flat", discountValue: 100, minOrder: 799, applicableTo: "cricket", active: true }
];

export default function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { code, subtotal = 0, applicableTo = "all" } = req.body || {};
  const coupon = coupons.find((item) => item.code.toLowerCase() === String(code).toLowerCase() && item.active);
  if (!coupon) {
    res.status(404).json({ valid: false, discount: 0, message: "Coupon not found" });
    return;
  }
  if (coupon.applicableTo !== "all" && coupon.applicableTo !== applicableTo) {
    res.status(400).json({ valid: false, discount: 0, message: "Coupon cannot be used here" });
    return;
  }
  if (Number(subtotal) < coupon.minOrder) {
    res.status(400).json({ valid: false, discount: 0, message: `Minimum order is Rs. ${coupon.minOrder}` });
    return;
  }
  const discount =
    coupon.discountType === "percent" ? Math.round((Number(subtotal) * coupon.discountValue) / 100) : coupon.discountValue;
  res.status(200).json({ valid: true, discount: Math.min(discount, Number(subtotal)), message: "Coupon applied" });
}
