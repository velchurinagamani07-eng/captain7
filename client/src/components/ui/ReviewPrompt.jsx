import { Star } from "lucide-react";
import { useReviewUrl } from "../../hooks/useSettings.js";
import { Button } from "./Button.jsx";
import { Modal } from "./Modal.jsx";

const WEEK = 7 * 24 * 60 * 60 * 1000;

export function shouldShowReviewPrompt(key = "food") {
  const last = Number(localStorage.getItem(`captain7:reviewPrompt:${key}`));
  return !last || Date.now() - last > WEEK;
}

export function ReviewPrompt({ open, onClose, type = "food" }) {
  const reviewUrl = useReviewUrl();
  const message =
    type === "cricket"
      ? "Enjoyed your game? Leave us a Google Review!"
      : "Thank you for your order! Enjoyed your meal? It takes 30 seconds - your review helps us grow!";

  const close = () => {
    localStorage.setItem(`captain7:reviewPrompt:${type}`, String(Date.now()));
    onClose();
  };

  return (
    <Modal open={open} onClose={close} title="Thank You">
      <div className="text-center">
        <p className="mx-auto max-w-md text-white/70">{message}</p>
        <div className="mt-5 flex justify-center gap-1">
          {Array.from({ length: 5 }).map((_, index) => (
            <Star key={index} className="fill-captain-gold text-captain-gold" />
          ))}
        </div>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <a href={reviewUrl} target="_blank" rel="noreferrer" onClick={close}>
            <Button>Leave A Review</Button>
          </a>
          <Button variant="secondary" onClick={close}>Maybe Later</Button>
        </div>
      </div>
    </Modal>
  );
}
