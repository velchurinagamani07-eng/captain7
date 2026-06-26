import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { CheckCircle2, MessageCircle, Star, ZoomIn } from "lucide-react";
import { PageTransition } from "../components/common/PageTransition.jsx";
import { BrandMark } from "../components/common/BrandMark.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Card } from "../components/ui/Card.jsx";
import { Toast } from "../components/ui/Toast.jsx";
import { openOwnerWhatsApp, whatsappUrl } from "../utils/whatsapp.js";
import { formatCurrency } from "../utils/formatCurrency.js";
import { useImageViewer } from "../context/ImageViewerContext.jsx";
import { db, hasFirebaseConfig } from "../firebase/config.js";

const proof = ["4.5 Star Rating", "1600+ Reviews", "2 Locations", "8-12 Month ROI"];
const investment = [
  ["Infrastructure Setup", 120000],
  ["Equipment & Turf", 80000],
  ["Brand License", 30000],
  ["Training & Launch", 20000]
];
const benefits = [
  "Box cricket turf setup",
  "Food menu license",
  "Online booking platform",
  "Brand kit and signage",
  "Analytics dashboard",
  "Staff training",
  "Marketing templates",
  "WhatsApp support"
];
const faqs = [
  ["What is the investment?", "The Captain 7 franchise starts at Rs. 2.5 lakhs."],
  ["What support is included?", "Setup guidance, training, menu rights, brand kit, marketing templates, and platform access."],
  ["How long for ROI?", "The expected ROI window is 8-12 months, depending on location and operations."],
  ["Can I apply from another city?", "Yes. Submit your city and timeline and the team will review the opportunity."]
];
const franchiseHeroImage = "https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1800&q=80";

export default function Franchise() {
  const [toast, setToast] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showSticky, setShowSticky] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const { register, handleSubmit, reset } = useForm();
  const { openImageViewer } = useImageViewer();
  const utm = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      utm_source: params.get("utm_source") || "",
      utm_medium: params.get("utm_medium") || "",
      utm_campaign: params.get("utm_campaign") || ""
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setShowSticky(window.scrollY > window.innerHeight * 0.35);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const submit = async (values) => {
    const payload = {
      ...values,
      ...utm,
      status: "new",
      source: "franchise-page"
    };

    try {
      if (hasFirebaseConfig && db) {
        await addDoc(collection(db, "franchiseLeads"), {
          ...payload,
          createdAt: serverTimestamp()
        });
      }
      setToast("Franchise application saved.");
    } catch {
      setToast("Saved locally. Please use WhatsApp if you do not hear back.");
    }

    localStorage.setItem("captain7:lastFranchiseLead", JSON.stringify({ ...payload, createdAt: new Date().toISOString() }));
    openOwnerWhatsApp(`New Captain 7 franchise application. Name: ${values.name}. Phone: ${values.phone}. City: ${values.city}.`);
    setSubmitted(true);
    reset();
    setTimeout(() => setToast(""), 2000);
  };

  return (
    <PageTransition>
      <section className="relative min-h-[92svh] overflow-hidden bg-captain-black">
        <button
          type="button"
          onClick={() => openImageViewer({ images: [{ id: "franchise-hero", url: franchiseHeroImage, title: "Captain 7 franchise venue" }], index: 0 })}
          className="absolute inset-0 cursor-zoom-in text-left"
          aria-label="Open franchise venue image"
        >
          <img
            src={franchiseHeroImage}
            alt="Cricket venue"
            className="h-full w-full object-cover opacity-42"
          />
          <span className="absolute right-4 top-24 grid h-10 w-10 place-items-center rounded-full border border-captain-gold/45 bg-black/70 text-white shadow-gold transition hover:bg-captain-gold hover:text-captain-black md:top-6">
            <ZoomIn size={17} />
          </span>
        </button>
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(10,10,10,.96),rgba(10,10,10,.70),rgba(10,10,10,.38))]" />
        <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:repeating-linear-gradient(135deg,rgba(201,168,76,.35)_0_1px,transparent_1px_48px)]" />

        <div className="pointer-events-none section-shell relative z-10 flex min-h-[92svh] flex-col justify-between py-5 md:py-6">
          <div className="pointer-events-auto flex items-center justify-between">
            <BrandMark size="sm" />
            <a href={whatsappUrl("Hi Captain 7, I want franchise details.")} target="_blank" rel="noreferrer">
              <Button variant="secondary" icon={MessageCircle} size="sm">WhatsApp</Button>
            </a>
          </div>

          <motion.div
            initial={{ y: 28, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="pointer-events-auto max-w-3xl py-8 md:py-10"
          >
            <div className="mb-4 font-nav text-xs font-extrabold uppercase tracking-[0.18em] text-captain-bright">
              Captain 7 Franchise
            </div>
            <h1 className="font-bebas text-[clamp(3.5rem,15vw,9rem)] leading-[0.9] text-white">BE THE CAPTAIN</h1>
            <p className="mt-4 max-w-2xl font-garamond text-[1.6rem] leading-tight text-white/82 md:text-4xl">
              Own a sports and dining venue built for repeat footfall.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="rounded-lg border border-captain-gold bg-captain-gold px-4 py-3 font-bebas text-3xl leading-none text-captain-black md:text-4xl">
                Rs. 2.5 LAKHS
              </span>
              <span className="text-sm leading-6 text-white/62">Starting investment with brand, setup, and launch support.</span>
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#apply"><Button>Apply Now</Button></a>
              <a href={whatsappUrl("Hi Captain 7, I am interested in the franchise.")} target="_blank" rel="noreferrer">
                <Button variant="secondary">Talk To Team</Button>
              </a>
            </div>
          </motion.div>

          <div className="grid grid-cols-2 gap-2 pb-2 lg:grid-cols-4">
            {proof.map((item, index) => (
              <motion.div
                key={item}
                initial={{ y: 16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.25 + index * 0.06 }}
                className="rounded-lg border border-white/10 bg-captain-black/68 px-3 py-2 text-center font-bebas text-xl text-captain-bright backdrop-blur md:px-4 md:py-3 md:text-2xl"
              >
                {item}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-captain-black py-12">
        <div className="section-shell grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <div className="font-nav text-xs font-extrabold uppercase tracking-[0.18em] text-captain-gold">Why It Works</div>
            <h2 className="mt-2 font-bebas text-6xl leading-none text-white">A READY MODEL</h2>
            <p className="mt-4 text-sm leading-7 text-white/62">
              Cricket bookings, food orders, parties, and youth-driven local demand give Captain 7 multiple revenue lanes.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit}
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.04 }}
                className="rounded-lg border border-white/10 bg-captain-card p-4 text-sm text-white/70"
              >
                <CheckCircle2 className="mb-3 text-captain-gold" size={20} />
                {benefit}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-captain-charcoal py-12">
        <div className="section-shell grid gap-5 lg:grid-cols-2">
          <Card hover={false}>
            <h2 className="font-bebas text-5xl text-white">INVESTMENT BREAKDOWN</h2>
            <div className="mt-5 grid gap-3">
              {investment.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between rounded-lg border border-white/10 bg-captain-black p-4">
                  <span className="text-sm text-white/68">{label}</span>
                  <span className="font-bebas text-3xl text-captain-bright">{formatCurrency(value)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-lg border border-captain-gold bg-captain-gold/10 p-4 text-sm text-white/74">
              Expected revenue: <span className="font-bebas text-3xl text-captain-bright">Rs. 45K-Rs. 80K/month</span>
            </div>
          </Card>

          <Card hover={false}>
            {submitted ? (
              <div className="grid min-h-[360px] place-items-center text-center">
                <div>
                  <div className="mb-4 flex justify-center"><BrandMark size="md" /></div>
                  <h2 className="font-bebas text-6xl text-white">THANK YOU</h2>
                  <p className="mt-2 text-white/60">We received your application.</p>
                </div>
              </div>
            ) : (
              <form id="apply" onSubmit={handleSubmit(submit)} className="grid gap-4">
                <h2 className="font-bebas text-5xl text-white">APPLY NOW</h2>
                <input {...register("name", { required: true })} className="form-input" placeholder="Name" />
                <input {...register("phone", { required: true })} className="form-input" placeholder="Phone" />
                <input {...register("city", { required: true })} className="form-input" placeholder="City" />
                <select {...register("ready")} className="form-input">
                  <option>Immediate</option>
                  <option>Within 3 months</option>
                  <option>Exploring</option>
                </select>
                <textarea {...register("message")} className="form-input min-h-24 resize-y" placeholder="Message" />
                <Button type="submit">Submit Application</Button>
              </form>
            )}
          </Card>
        </div>
      </section>

      <section className="bg-captain-black py-12">
        <div className="section-shell grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <Card hover={false}>
            <div className="mb-3 flex gap-1">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star key={index} className="fill-captain-gold text-captain-gold" size={18} />
              ))}
            </div>
            <p className="font-garamond text-3xl text-white">"A compact model with multiple daily revenue streams."</p>
            <p className="mt-4 text-sm text-white/48">Captain 7 Franchise Desk</p>
          </Card>
          <div className="grid gap-2">
            {faqs.map(([question, answer], index) => (
              <button
                key={question}
                type="button"
                onClick={() => setOpenFaq(openFaq === index ? -1 : index)}
                className="rounded-lg border border-white/10 bg-captain-card p-4 text-left"
              >
                <span className="font-semibold text-white">{question}</span>
                {openFaq === index ? <span className="mt-2 block text-sm leading-6 text-white/58">{answer}</span> : null}
              </button>
            ))}
          </div>
        </div>
      </section>

      {showSticky ? (
        <div className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-2 gap-2 border-t border-captain-border bg-captain-black/94 p-3 backdrop-blur md:hidden">
          <a href="#apply"><Button className="w-full">Apply</Button></a>
          <a href={whatsappUrl("Hi Captain 7, I want franchise details.")} target="_blank" rel="noreferrer">
            <Button variant="secondary" className="w-full" icon={MessageCircle}>WhatsApp</Button>
          </a>
        </div>
      ) : null}
      <Toast message={toast} tone="green" />
    </PageTransition>
  );
}
