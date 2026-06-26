import express from "express";
import { getAdminAuth, getAdminDb } from "../firebase-admin.js";
import { verifyFirebase } from "../middleware/verifyFirebase.js";

const router = express.Router();

function toE164IndianPhone(phone = "") {
  const clean = String(phone).replace(/\D/g, "");
  if (!clean) return "";
  if (clean.length === 10) return `+91${clean}`;
  if (clean.length === 11 && clean.startsWith("0")) return `+91${clean.slice(1)}`;
  if (clean.startsWith("91")) return `+${clean}`;
  return phone.startsWith("+") ? phone : "";
}

async function requireAdmin(req, res, next) {
  const db = getAdminDb();
  if (!db) {
    next();
    return;
  }

  try {
    const callerUid = req.user?.uid;
    if (!callerUid) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const userDoc = await db.collection("users").doc(callerUid).get();
    if (!userDoc.exists || userDoc.data().role !== "admin") {
      res.status(403).json({ error: "Access denied. Admin role required." });
      return;
    }
    next();
  } catch (error) {
    next(error);
  }
}

router.post("/", verifyFirebase, requireAdmin, async (req, res) => {
  const { name, email, password, phone } = req.body || {};

  if (!name || !email || !password || !phone) {
    res.status(400).json({ error: "Name, email, password, and phone are required" });
    return;
  }

  const auth = getAdminAuth();
  const db = getAdminDb();

  if (!auth || !db) {
    res.status(200).json({
      success: true,
      uid: `demo_worker_${Date.now()}`,
      message: "Demo mode: simulated worker creation successful."
    });
    return;
  }

  try {
    const phoneNumber = toE164IndianPhone(phone);
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
      ...(phoneNumber ? { phoneNumber } : {})
    });

    const uid = userRecord.uid;
    await db.collection("users").doc(uid).set({
      uid,
      name,
      email,
      phone,
      role: "worker",
      createdAt: new Date(),
      updatedAt: new Date()
    });

    res.status(201).json({ success: true, uid, message: "Worker account created successfully." });
  } catch (error) {
    res.status(400).json({ error: error.message || "Failed to create worker account" });
  }
});

router.put("/:uid", verifyFirebase, requireAdmin, async (req, res) => {
  const { uid } = req.params;
  const { name, phone } = req.body || {};

  if (!name || !phone) {
    res.status(400).json({ error: "Name and phone are required" });
    return;
  }

  const auth = getAdminAuth();
  const db = getAdminDb();

  if (!auth || !db) {
    res.status(200).json({ success: true, message: "Demo mode: simulated worker update successful." });
    return;
  }

  try {
    const phoneNumber = toE164IndianPhone(phone);
    await auth.updateUser(uid, {
      displayName: name,
      ...(phoneNumber ? { phoneNumber } : {})
    });
    await db.collection("users").doc(uid).set(
      {
        name,
        phone,
        updatedAt: new Date()
      },
      { merge: true }
    );
    res.status(200).json({ success: true, message: "Worker updated successfully." });
  } catch (error) {
    res.status(400).json({ error: error.message || "Failed to update worker" });
  }
});

router.delete("/:uid", verifyFirebase, requireAdmin, async (req, res) => {
  const { uid } = req.params;
  const auth = getAdminAuth();
  const db = getAdminDb();

  if (!auth || !db) {
    res.status(200).json({ success: true, message: "Demo mode: simulated worker deletion successful." });
    return;
  }

  try {
    await auth.deleteUser(uid);
    await db.collection("users").doc(uid).delete();
    res.status(200).json({ success: true, message: "Worker deleted successfully." });
  } catch (error) {
    res.status(400).json({ error: error.message || "Failed to delete worker" });
  }
});

export default router;
