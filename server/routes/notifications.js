import express from "express";

const router = express.Router();

router.post("/whatsapp", (req, res) => {
  const { message = "Captain 7 notification", phone = "919000469552" } = req.body || {};
  res.status(200).json({
    url: `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
    delivery: "deep-link"
  });
});

export default router;
