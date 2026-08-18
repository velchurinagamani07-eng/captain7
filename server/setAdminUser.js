import { getAdminAuth, getAdminDb } from "./firebaseAdmin.js";

const email = process.env.ADMIN_EMAIL || "admin@captian7.com";
const password = process.env.ADMIN_PASSWORD || "Captian@718";

const auth = getAdminAuth();
const db = getAdminDb();

if (!auth || !db) {
  console.error("Firebase Admin env values are required in server/.env: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.");
  process.exit(1);
}

try {
  let userRecord;
  try {
    userRecord = await auth.getUserByEmail(email);
    console.log(`User ${email} exists. Updating password...`);
    await auth.updateUser(userRecord.uid, { password: password });
    console.log("Password updated successfully.");
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      console.log(`User ${email} does not exist. Creating user...`);
      userRecord = await auth.createUser({
        email,
        password,
        emailVerified: true
      });
      console.log("User created successfully.");
    } else {
      throw error;
    }
  }

  const uid = userRecord.uid;
  console.log(`Setting admin role for UID: ${uid} in Firestore...`);

  // Set the admin role under the actual Firebase UID
  await db.collection("users").doc(uid).set(
    {
      uid,
      email,
      role: "admin",
      updatedAt: new Date()
    },
    { merge: true }
  );

  // Also clear/update the legacy document if it exists to keep Firestore clean
  const legacyId = email.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  await db.collection("users").doc(legacyId).set(
    {
      email,
      role: "admin",
      updatedAt: new Date()
    },
    { merge: true }
  );

  console.log(`Admin user successfully configured! You can now log in with:`);
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  process.exit(0);
} catch (error) {
  console.error("Error setting admin user:", error);
  process.exit(1);
}
