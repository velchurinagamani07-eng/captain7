import { getAdminDb } from "../../server/firebaseAdmin.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const db = getAdminDb();
  let bookings = [
    { id: "C7-2401", name: "Aditya", phone: "9000469552", date: "Today", startTime: "6:00 PM", amount: 999, status: "confirmed" }
  ];

  if (db) {
    const snapshot = await db.collection("bookings").orderBy("createdAt", "desc").limit(500).get();
    bookings = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  const header = ["id", "name", "phone", "date", "startTime", "amount", "status"];
  const csv = [
    header.join(","),
    ...bookings.map((booking) => header.map((key) => JSON.stringify(booking[key] || "")).join(","))
  ].join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=captain-7-bookings.csv");
  res.status(200).send(csv);
}
