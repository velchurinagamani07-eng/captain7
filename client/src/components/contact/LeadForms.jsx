import { useState } from "react";
import { useForm } from "react-hook-form";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { Download, MessageCircle } from "lucide-react";
import { brand } from "../../data/siteData.js";
import { Button } from "../ui/Button.jsx";
import { Toast } from "../ui/Toast.jsx";
import { db, hasFirebaseConfig } from "../../firebase/config.js";

export function ContactForm() {
  const [toast, setToast] = useState("");
  const { register, handleSubmit, reset } = useForm();
  const submit = async (values) => {
    try {
      if (hasFirebaseConfig && db) {
        await addDoc(collection(db, "contactLeads"), {
          ...values,
          status: "new",
          source: "website-contact",
          createdAt: serverTimestamp()
        });
      }
      setToast(`Thank you ${values.name || ""}. We will contact you shortly.`);
      reset();
    } catch {
      setToast("Could not save to Firebase. Please try WhatsApp.");
    } finally {
      setTimeout(() => setToast(""), 2200);
    }
  };
  return (
    <>
      <form onSubmit={handleSubmit(submit)} className="grid gap-4 rounded-lg border border-captain-gold/25 bg-captain-card p-5 shadow-gold">
        <h2 className="font-serif text-2xl font-bold text-white">Contact Captain 7</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Name"><input {...register("name", { required: true })} className="form-input" /></Field>
          <Field label="Phone"><input {...register("phone", { required: true })} className="form-input" /></Field>
          <Field label="Email"><input {...register("email")} type="email" className="form-input" /></Field>
          <Field label="Subject">
            <select {...register("subject")} className="form-input">
              <option>Booking Enquiry</option>
              <option>Food Order</option>
              <option>Party</option>
              <option>Franchise</option>
              <option>Other</option>
            </select>
          </Field>
        </div>
        <Field label="Message"><textarea {...register("message")} className="form-input min-h-32 resize-y" /></Field>
        <div className="flex flex-wrap gap-3">
          <Button type="submit">Submit</Button>
          <a
            href={`https://wa.me/${brand.whatsappNumber}?text=${encodeURIComponent("Hi Captain 7, I have an enquiry.")}`}
            target="_blank"
            rel="noreferrer"
          >
            <Button type="button" variant="secondary" icon={MessageCircle}>WhatsApp</Button>
          </a>
        </div>
      </form>
      <Toast message={toast} tone="green" />
    </>
  );
}

export function FranchiseForm({ compact = false }) {
  const [toast, setToast] = useState("");
  const { register, handleSubmit, reset } = useForm();
  const submit = async (values) => {
    try {
      if (hasFirebaseConfig && db) {
        await addDoc(collection(db, "franchiseLeads"), {
          ...values,
          status: "new",
          source: "website-contact",
          createdAt: serverTimestamp()
        });
      }
      setToast(`Franchise enquiry saved for ${values.city || "your city"}.`);
      reset();
    } catch {
      setToast("Could not save to Firebase. Please try WhatsApp.");
    } finally {
      setTimeout(() => setToast(""), 2200);
    }
  };
  return (
    <>
      <form onSubmit={handleSubmit(submit)} className={`grid gap-4 rounded-lg border border-captain-gold/25 bg-captain-card p-5 shadow-gold ${compact ? "" : "lg:p-7"}`}>
        <h2 className="font-serif text-2xl font-bold text-white">Franchise Enquiry</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Name"><input {...register("name", { required: true })} className="form-input" /></Field>
          <Field label="City"><input {...register("city", { required: true })} className="form-input" /></Field>
          <Field label="Investment Budget"><input {...register("budget")} className="form-input" placeholder="Rs. 2.5 Lakhs+" /></Field>
          <Field label="Phone"><input {...register("phone", { required: true })} className="form-input" /></Field>
          <Field label="Email"><input {...register("email")} type="email" className="form-input" /></Field>
        </div>
        <Field label="Message"><textarea {...register("message")} className="form-input min-h-28 resize-y" /></Field>
        <div className="flex flex-wrap gap-3">
          <Button type="submit">Enquire Now</Button>
          <Button type="button" variant="secondary" icon={Download}>Brochure</Button>
        </div>
      </form>
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
