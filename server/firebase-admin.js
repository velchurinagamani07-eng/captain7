import dotenv from "dotenv";
import admin from "firebase-admin";

dotenv.config({ path: new URL("./.env", import.meta.url) });

const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/^"|"$/g, "").replace(/\\n/g, "\n");

export function getFirebaseAdmin() {
  if (admin.apps.length) return admin.app();

  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
    return null;
  }

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey
    })
  });
}

export function getAdminAuth() {
  const app = getFirebaseAdmin();
  return app ? admin.auth(app) : null;
}

export function getAdminDb() {
  const app = getFirebaseAdmin();
  return app ? admin.firestore(app) : null;
}

export default admin;
