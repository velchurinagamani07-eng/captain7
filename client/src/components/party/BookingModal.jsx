import { useState } from "react";
import { useForm } from "react-hook-form";
import { Modal } from "../ui/Modal.jsx";
import { Button } from "../ui/Button.jsx";
import { Toast } from "../ui/Toast.jsx";

export function BookingModal({ pack, open, onClose }) {
  const [toast, setToast] = useState("");
  const { register, handleSubmit, reset } = useForm({ defaultValues: { guestCount: 20 } });

  const submit = (values) => {
    setToast(`Event enquiry saved for ${values.name || "guest"}.`);
    reset();
    setTimeout(() => {
      setToast("");
      onClose();
    }, 1400);
  };

  return (
    <>
      <Modal open={open} onClose={onClose} title={pack ? `Book ${pack.name}` : "Book Package"}>
        <form onSubmit={handleSubmit(submit)} className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Name">
              <input {...register("name", { required: true })} className="form-input" />
            </Field>
            <Field label="Phone">
              <input {...register("phone", { required: true })} className="form-input" />
            </Field>
            <Field label="Date">
              <input {...register("date", { required: true })} type="date" className="form-input" />
            </Field>
            <Field label="Occasion">
              <select {...register("occasion")} className="form-input">
                <option>Birthday</option>
                <option>Corporate</option>
                <option>Anniversary</option>
                <option>Team Event</option>
              </select>
            </Field>
          </div>
          <Field label="Guest Count">
            <input {...register("guestCount")} type="range" min="10" max="120" className="accent-captain-gold" />
          </Field>
          <Field label="Special Requests">
            <textarea {...register("specialRequests")} className="form-input min-h-28 resize-y" />
          </Field>
          <Button type="submit">Submit Enquiry</Button>
        </form>
      </Modal>
      <Toast message={toast} tone="green" />
    </>
  );
}

function Field({ label, children }) {
  return (
    <label className="grid gap-2">
      <span className="font-nav text-xs font-extrabold uppercase tracking-[0.14em] text-white/60">{label}</span>
      {children}
    </label>
  );
}
