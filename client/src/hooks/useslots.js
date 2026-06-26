import { useCollection } from "./useFirestore.js";

export function useSlots(selectedDate) {
  const { data, loading, error } = useCollection("timeSlots", [], {
    live: true,
    orderBy: "startTime"
  });

  const slots = data.map((slot) => ({
    ...slot,
    date: slot.date || selectedDate,
    status: slot.status || "active"
  }));

  return { slots, loading, error };
}