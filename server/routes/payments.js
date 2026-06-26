import crypto from "crypto";
import express from "express";
import Razorpay from "razorpay";
import { verifyFirebase } from "../middleware/verifyFirebase.js";

const router = express.Router();

function hasLiveRazorpayKeys() {
  return Boolean(
    process.env.RAZORPAY_KEY_ID &&
      process.env.RAZORPAY_KEY_SECRET &&
      !process.env.RAZORPAY_KEY_ID.includes("REPLACE") &&
      !process.env.RAZORPAY_KEY_SECRET.includes("REPLACE")
  );
}

router.post("/create-order", verifyFirebase, async (req, res, next) => {
  try {
    const { amount, receipt, notes = {} } = req.body || {};
    if (!amount || Number(amount) <= 0) {
      res.status(400).json({ error: "Valid amount is required" });
      return;
    }

    if (!hasLiveRazorpayKeys()) {
      res.status(200).json({
        id: `order_demo_${Date.now()}`,
        amount: Math.round(Number(amount) * 100),
        currency: "INR",
        receipt: receipt || `c7_${Date.now()}`,
        demo: true
      });
      return;
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
    const order = await razorpay.orders.create({
      amount: Math.round(Number(amount) * 100),
      currency: "INR",
      receipt: receipt || `c7_${Date.now()}`,
      notes
    });
    res.status(200).json(order);
  } catch (error) {
    next(error);
  }
});

router.post("/verify", verifyFirebase, (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    res.status(400).json({ error: "Missing Razorpay verification payload" });
    return;
  }

  if (!hasLiveRazorpayKeys()) {
    res.status(200).json({ verified: true, demo: true });
    return;
  }

  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  res.status(200).json({ verified: expected === razorpay_signature });
});

export default router;
