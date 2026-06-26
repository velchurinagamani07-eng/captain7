export default function handler(req, res) {
  res.status(200).json({
    status: "ok",
    service: "Captain 7 Eat & Play",
    time: new Date().toISOString()
  });
}
