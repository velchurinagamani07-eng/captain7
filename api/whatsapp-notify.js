export default function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { phone = process.env.VITE_WHATSAPP_NUMBER || "919000469552", message = "Captain 7 notification" } = req.body || {};
  res.status(200).json({
    url: `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
    delivery: "deep-link"
  });
}
