import crypto from "crypto";

export default function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    res.status(400).json({ error: "Missing payment verification payload" });
    return;
  }

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    res.status(200).json({ verified: true, demo: true });
    return;
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  res.status(200).json({ verified: expected === razorpay_signature });
}
