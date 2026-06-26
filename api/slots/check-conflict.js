function toMinutes(value) {
  const [time, modifier] = String(value).trim().split(" ");
  let [hours, minutes] = time.split(":").map(Number);
  if (modifier === "PM" && hours !== 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

export default function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { slots = [], candidate } = req.body || {};
  if (!candidate?.startTime || !candidate?.endTime) {
    res.status(400).json({ error: "candidate.startTime and candidate.endTime are required" });
    return;
  }

  const start = toMinutes(candidate.startTime);
  const end = toMinutes(candidate.endTime);
  const conflict = slots.some((slot) => {
    if (slot.date && candidate.date && slot.date !== candidate.date) return false;
    return start < toMinutes(slot.endTime) && end > toMinutes(slot.startTime);
  });
  res.status(200).json({ conflict });
}
