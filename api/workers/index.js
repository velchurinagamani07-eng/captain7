import { getAdminAuth, getAdminDb } from "../../server/firebaseAdmin.js";

function toE164IndianPhone(phone = "") {
  const clean = String(phone).replace(/\D/g, "");
  if (!clean) return "";
  if (clean.length === 10) return `+91${clean}`;
  if (clean.length === 11 && clean.startsWith("0")) return `+91${clean.slice(1)}`;
  if (clean.startsWith("91")) return `+${clean}`;
  return phone.startsWith("+") ? phone : "";
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  const auth = getAdminAuth();
  const db = getAdminDb();

  // 1. GET: List workers or single worker
  if (req.method === "GET") {
    const uid = req.query.uid;
    if (uid && db) {
      const snap = await db.collection("users").doc(uid).get();
      if (!snap.exists) {
        res.status(404).json({ error: "Worker not found" });
        return;
      }
      res.status(200).json({ uid: snap.id, ...snap.data() });
      return;
    }

    if (db) {
      const snap = await db.collection("users").where("role", "==", "worker").get();
      const workers = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
      res.status(200).json(workers);
      return;
    }

    res.status(200).json([]);
    return;
  }

  // 2. POST: Create a new worker
  if (req.method === "POST") {
    const { name, email, password, phone } = req.body || {};

    if (!name || !email || !password || !phone) {
      res.status(400).json({ error: "Name, email, password, and phone are required" });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    if (!auth || !db) {
      res.status(200).json({
        success: true,
        uid: `worker_${Date.now()}`,
        message: "Worker created (serverless mode)."
      });
      return;
    }

    try {
      const phoneNumber = toE164IndianPhone(cleanPhone);
      const userRecord = await auth.createUser({
        email: cleanEmail,
        password,
        displayName: name.trim(),
        ...(phoneNumber ? { phoneNumber } : {})
      });

      const uid = userRecord.uid;
      await db.collection("users").doc(uid).set({
        uid,
        name: name.trim(),
        email: cleanEmail,
        phone: cleanPhone,
        role: "worker",
        createdAt: new Date(),
        updatedAt: new Date()
      });

      res.status(201).json({ success: true, uid, message: "Worker account created successfully." });
    } catch (error) {
      if (error.code === "auth/email-already-exists") {
        try {
          const userRecord = await auth.getUserByEmail(cleanEmail);
          const uid = userRecord.uid;
          await db.collection("users").doc(uid).set(
            {
              uid,
              name: name.trim(),
              email: cleanEmail,
              phone: cleanPhone,
              role: "worker",
              updatedAt: new Date()
            },
            { merge: true }
          );
          res.status(200).json({ success: true, uid, message: "Worker updated and assigned role." });
          return;
        } catch {}
      }
      res.status(400).json({ error: error.message || "Failed to create worker account" });
    }
    return;
  }

  // 3. PUT: Update worker
  if (req.method === "PUT") {
    const uid = req.query.uid || req.body?.uid;
    const { name, phone } = req.body || {};

    if (!uid) {
      res.status(400).json({ error: "Worker UID is required" });
      return;
    }

    try {
      if (auth) {
        const phoneNumber = toE164IndianPhone(phone);
        await auth.updateUser(uid, {
          ...(name ? { displayName: name.trim() } : {}),
          ...(phoneNumber ? { phoneNumber } : {})
        }).catch(() => null);
      }

      if (db) {
        await db.collection("users").doc(uid).set(
          {
            ...(name ? { name: name.trim() } : {}),
            ...(phone ? { phone: phone.trim() } : {}),
            role: "worker",
            updatedAt: new Date()
          },
          { merge: true }
        );
      }

      res.status(200).json({ success: true, message: "Worker updated successfully." });
    } catch (error) {
      res.status(400).json({ error: error.message || "Failed to update worker" });
    }
    return;
  }

  // 4. DELETE: Delete worker
  if (req.method === "DELETE") {
    const uid = req.query.uid || req.body?.uid;

    if (!uid) {
      res.status(400).json({ error: "Worker UID is required" });
      return;
    }

    try {
      if (auth) {
        await auth.deleteUser(uid).catch((err) => {
          console.warn("Auth delete user warning:", err.message);
        });
      }

      if (db) {
        await db.collection("users").doc(uid).delete().catch((err) => {
          console.warn("Firestore delete user warning:", err.message);
        });
      }

      res.status(200).json({ success: true, message: "Worker deleted successfully." });
    } catch (error) {
      res.status(400).json({ error: error.message || "Failed to delete worker" });
    }
    return;
  }

  res.setHeader("Allow", "GET, POST, PUT, DELETE");
  res.status(405).json({ error: "Method not allowed" });
}
