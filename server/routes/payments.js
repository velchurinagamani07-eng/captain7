import crypto from "crypto";
import express from "express";
import Razorpay from "razorpay";
import { verifyFirebase } from "../middleware/verifyFirebase.js";
import { getAdminDb } from "../firebase-admin.js";

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

router.post("/webhook", async (req, res, next) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];

    if (secret && signature) {
      const shasum = crypto.createHmac("sha256", secret);
      shasum.update(JSON.stringify(req.body));
      const digest = shasum.digest("hex");

      if (digest !== signature) {
        res.status(400).json({ error: "Invalid signature" });
        return;
      }
    }

    const event = req.body.event;
    if (event === "payment_link.paid" || event === "payment.captured") {
      const paymentEntity = req.body.payload.payment.entity;
      const notes = paymentEntity.notes || {};
      const description = paymentEntity.description || "";
      const email = paymentEntity.email || "";
      const contact = paymentEntity.contact || "";

      let bookingId = notes.bookingId || notes.booking_id;
      let orderId = notes.orderId || notes.order_id;
      
      if (!bookingId && typeof description === "string") {
        const match = description.match(/C7-M\d+|C7-\d+/);
        if (match) bookingId = match[0];
      }

      if (!orderId && typeof description === "string") {
        const match = description.match(/C7\d+/);
        if (match) orderId = match[0];
      }

      const db = getAdminDb();
      if (db) {
        if (bookingId) {
          const bookingRef = db.collection("bookings").doc(bookingId);
          const docSnap = await bookingRef.get();
          if (docSnap.exists) {
            await bookingRef.update({
              paymentStatus: "paid",
              status: "confirmed",
              paymentId: paymentEntity.id,
              updatedAt: new Date()
            });
            console.log(`Booking ${bookingId} marked as paid via webhook.`);
          }
        } else if (orderId) {
          const orderRef = db.collection("orders").doc(orderId);
          const docSnap = await orderRef.get();
          if (docSnap.exists) {
            await orderRef.update({
              status: "accepted",
              paymentStatus: "paid",
              updatedAt: new Date()
            });
            console.log(`Order ${orderId} marked as paid via webhook.`);
          }
          const foodOrderRef = db.collection("foodOrders").doc(orderId);
          const foodSnap = await foodOrderRef.get();
          if (foodSnap.exists) {
            await foodOrderRef.update({
              status: "accepted",
              paymentStatus: "paid",
              updatedAt: new Date()
            });
          }
        } else {
          const cleanPhone = contact.replace(/\D/g, "");
          if (cleanPhone) {
            const bookingsRef = db.collection("bookings");
            const qSnap = await bookingsRef
              .where("paymentStatus", "==", "pending")
              .where("status", "==", "pending")
              .get();
              
            let foundDoc = null;
            qSnap.forEach(d => {
              const b = d.data();
              const bPhone = (b.userPhone || "").replace(/\D/g, "");
              if (bPhone && bPhone.endsWith(cleanPhone.slice(-10))) {
                foundDoc = d;
              }
            });
            
            if (foundDoc) {
              await foundDoc.ref.update({
                paymentStatus: "paid",
                status: "confirmed",
                paymentId: paymentEntity.id,
                updatedAt: new Date()
              });
              console.log(`Booking ${foundDoc.id} matched by phone and marked as paid via webhook.`);
            }
          }
        }
      }
    }
    
    res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error("Webhook processing error:", error);
    next(error);
  }
});

export default router;
