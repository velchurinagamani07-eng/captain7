import { getAdminAuth } from "../firebase-admin.js";

export async function verifyFirebase(req, res, next) {
  const auth = getAdminAuth();
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!auth) {
    req.user = { uid: "dev-user", email: "dev@captain7.local", role: "dev" };
    next();
    return;
  }

  if (!token) {
    res.status(401).json({ error: "Firebase auth token required" });
    return;
  }

  try {
    req.user = await auth.verifyIdToken(token);
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid Firebase auth token" });
  }
}
