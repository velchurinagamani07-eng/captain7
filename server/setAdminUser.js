import { getAdminDb } from "./firebaseAdmin.js";

const uid = process.env.ADMIN_UID;
const email = process.env.ADMIN_EMAIL;

if (!uid && !email) {
  console.error("Set ADMIN_UID or ADMIN_EMAIL before running this script.");
  process.exit(1);
}

const db = getAdminDb();
if (!db) {
  console.error("Firebase Admin env values are required: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.");
  process.exit(1);
}

const userId = uid || email.replace(/[^a-z0-9]/gi, "_").toLowerCase();
await db.collection("users").doc(userId).set(
  {
    email,
    role: "admin",
    updatedAt: new Date()
  },
  { merge: true }
);

console.log(`Admin role set for ${userId}.`);
