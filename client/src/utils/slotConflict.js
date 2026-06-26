function toMinutes(value) {
  const [time, modifier] = value.trim().split(" ");
  let [hours, minutes] = time.split(":").map(Number);
  if (modifier === "PM" && hours !== 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

export function hasSlotConflict(slots, candidate) {
  const candidateStart = toMinutes(candidate.startTime);
  const candidateEnd = toMinutes(candidate.endTime);
  return slots.some((slot) => {
    if (slot.date && candidate.date && slot.date !== candidate.date) return false;
    const start = toMinutes(slot.startTime);
    const end = toMinutes(slot.endTime);
    return candidateStart < end && candidateEnd > start;
  });
}
