import Razorpay from "razorpay";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { paymentId, amount } = req.body || {};
  if (!paymentId) {
    res.status(400).json({ error: "paymentId is required" });
    return;
  }

  const keyId = process.env.VITE_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    res.status(200).json({ id: `rfnd_demo_${Date.now()}`, paymentId, amount, demo: true });
    return;
  }

  const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
  const refund = await razorpay.payments.refund(paymentId, amount ? { amount: Math.round(Number(amount) * 100) } : {});
  res.status(200).json(refund);
}
