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
  res.setHeader("Access-Control-Allow-Methods", "GET, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  const { uid } = req.query;
  if (!uid) {
    res.status(400).json({ error: "Worker UID is required" });
    return;
  }

  const auth = getAdminAuth();
  const db = getAdminDb();

  // 1. GET: Fetch worker details
  if (req.method === "GET") {
    if (db) {
      const snap = await db.collection("users").doc(uid).get();
      if (!snap.exists) {
        res.status(404).json({ error: "Worker not found" });
        return;
      }
      res.status(200).json({ uid: snap.id, ...snap.data() });
      return;
    }
    res.status(200).json({ uid, message: "Worker detail" });
    return;
  }

  // 2. PUT: Update worker
  if (req.method === "PUT") {
    const { name, phone } = req.body || {};
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

  // 3. DELETE: Delete worker
  if (req.method === "DELETE") {
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

  res.setHeader("Allow", "GET, PUT, DELETE");
  res.status(405).json({ error: "Method not allowed" });
}
