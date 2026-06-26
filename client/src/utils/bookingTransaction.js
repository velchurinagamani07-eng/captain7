import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { db, hasFirebaseConfig } from "../firebase/config.js";

function lockIdFor({ date, startTime, endTime }) {
  return `${date}_${startTime}_${endTime}`.replace(/[^a-z0-9]/gi, "_").toLowerCase();
}

export async function createBookingWithTransaction(booking) {
  if (!hasFirebaseConfig || !db) {
    return { id: booking.id || `C7-${Date.now().toString().slice(-6)}`, demo: true };
  }

  const bookingId = booking.id || `C7-${Date.now().toString().slice(-6)}`;
  const lockRef = doc(db, "bookingLocks", lockIdFor(booking));
  const bookingRef = doc(db, "bookings", bookingId);

  await runTransaction(db, async (transaction) => {
    const lock = await transaction.get(lockRef);
    if (lock.exists() && lock.data().status !== "cancelled") {
      throw new Error("SLOT_TAKEN");
    }

    transaction.set(lockRef, {
      bookingId,
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      status: "confirmed",
      createdAt: serverTimestamp()
    });
    transaction.set(bookingRef, {
      ...booking,
      id: bookingId,
      status: "confirmed",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  });

  return { id: bookingId, demo: false };
}
