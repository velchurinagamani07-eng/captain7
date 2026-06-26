import { getAdminDb } from "./firebaseAdmin.js";

const slots = [
  { startTime: "4:00 PM", endTime: "5:00 PM", price: 899, maxPlayers: 12, status: "active" },
  { startTime: "5:00 PM", endTime: "6:00 PM", price: 899, maxPlayers: 12, status: "active" },
  { startTime: "6:00 PM", endTime: "7:00 PM", price: 999, maxPlayers: 12, status: "active" },
  { startTime: "7:00 PM", endTime: "8:00 PM", price: 1099, maxPlayers: 12, status: "active" }
];

const db = getAdminDb();
if (!db) {
  console.error("Firebase Admin env values are required: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.");
  process.exit(1);
}

const batch = db.batch();
slots.forEach((slot) =>
  batch.set(db.collection("slots").doc(), {
    ...slot,
    label: slot.label || "Prime Slot",
    isActive: true,
    availableDays: [0, 1, 2, 3, 4, 5, 6],
    createdAt: new Date()
  })
);
await batch.commit();
console.log("Seeded Captain 7 time slots.");
