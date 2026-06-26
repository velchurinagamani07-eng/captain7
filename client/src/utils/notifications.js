import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db, hasFirebaseConfig } from "../firebase/config.js";

export function playNotificationChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const audioCtx = new AudioContext();
    const tones = [
      { frequency: 523.25, start: 0, duration: 0.28 },
      { frequency: 659.25, start: 0.1, duration: 0.34 }
    ];

    tones.forEach((tone) => {
      const oscillator = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      oscillator.connect(gain);
      gain.connect(audioCtx.destination);
      oscillator.frequency.value = tone.frequency;
      gain.gain.setValueAtTime(0.001, audioCtx.currentTime + tone.start);
      gain.gain.exponentialRampToValueAtTime(0.18, audioCtx.currentTime + tone.start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + tone.start + tone.duration);
      oscillator.start(audioCtx.currentTime + tone.start);
      oscillator.stop(audioCtx.currentTime + tone.start + tone.duration);
    });
  } catch {
    // Browsers may block audio until user interaction; notifications still render.
  }
}

export async function createNotification({
  type,
  title,
  message,
  link = "",
  targetRole = "admin",
  targetUserId = ""
}) {
  if (!hasFirebaseConfig || !db) return;

  await addDoc(collection(db, "notifications"), {
    type,
    title,
    message,
    link,
    isRead: false,
    createdAt: serverTimestamp(),
    targetRole,
    targetUserId
  });
}
