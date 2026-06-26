import express from "express";
import { getAdminDb } from "../firebase-admin.js";
import { verifyFirebase } from "../middleware/verifyFirebase.js";

const router = express.Router();

router.get("/summary", verifyFirebase, async (req, res, next) => {
  try {
    const db = getAdminDb();
    if (!db) {
      res.status(200).json({
        totalBookings: 18,
        cricketRevenue: 48700,
        foodRevenue: 32600,
        combinedRevenue: 81300,
        source: "demo"
      });
      return;
    }

    const [bookings, orders] = await Promise.all([
      db.collection("bookings").get(),
      db.collection("foodOrders").get()
    ]);
    const cricketRevenue = bookings.docs.reduce((sum, doc) => sum + Number(doc.data().amount || 0), 0);
    const foodRevenue = orders.docs.reduce((sum, doc) => sum + Number(doc.data().total || 0), 0);
    res.status(200).json({
      totalBookings: bookings.size,
      cricketRevenue,
      foodRevenue,
      combinedRevenue: cricketRevenue + foodRevenue,
      source: "firestore"
    });
  } catch (error) {
    next(error);
  }
});

export default router;
