import Razorpay from "razorpay";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { amount, receipt } = req.body || {};
  if (!amount || Number(amount) <= 0) {
    res.status(400).json({ error: "Valid amount is required" });
    return;
  }

  const keyId = process.env.VITE_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    res.status(200).json({
      id: `order_demo_${Date.now()}`,
      amount: Math.round(Number(amount) * 100),
      currency: "INR",
      demo: true
    });
    return;
  }

  const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
  const order = await razorpay.orders.create({
    amount: Math.round(Number(amount) * 100),
    currency: "INR",
    receipt: receipt || `c7_${Date.now()}`
  });
  res.status(200).json(order);
}
