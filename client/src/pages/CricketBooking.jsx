import { useEffect, useMemo, useState } from "react";
import { Activity } from "lucide-react";
import { HeroSlider } from "../components/home/HeroSlider.jsx";
import { SlotCalendar } from "../components/booking/SlotCalendar.jsx";
import { SlotCard } from "../components/booking/SlotCard.jsx";
import { BookingForm } from "../components/booking/BookingForm.jsx";
import { BookingConfirmation } from "../components/booking/BookingConfirmation.jsx";
import { PageTransition } from "../components/common/PageTransition.jsx";
import { SectionHeader } from "../components/common/SectionHeader.jsx";
import { useSlots } from "../hooks/useslots.js";
import { ReviewPrompt, shouldShowReviewPrompt } from "../components/ui/ReviewPrompt.jsx";

export default function CricketBooking() {
  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [booking, setBooking] = useState(null);
  const { slots } = useSlots(selectedDate);
  const todaysSlots = useMemo(() => slots.slice(0, 6), [slots]);
  const [reviewOpen, setReviewOpen] = useState(false);

  useEffect(() => {
    if (!booking) return undefined;
    const timer = setTimeout(() => {
      if (shouldShowReviewPrompt("cricket")) setReviewOpen(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, [booking]);

  if (booking) {
    return (
      <PageTransition>
        <section className="min-h-screen bg-captain-black px-4 pb-20 pt-32">
          <div className="mx-auto max-w-3xl">
            <BookingConfirmation booking={booking} />
          </div>
          <ReviewPrompt open={reviewOpen} onClose={() => setReviewOpen(false)} type="cricket" />
        </section>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <HeroSlider single pageKey="cricketBooking" title="BOOK YOUR SLOT" subtitle="" image="https://images.unsplash.com/photo-1593766788306-28561086694e?auto=format&fit=crop&w=1800&q=80" />
      <section className="bg-captain-black py-12">
        <div className="section-shell">
          <SectionHeader eyebrow="Live Availability" title="CRICKET BOOKING">
            Select a date, reserve a live slot, add player details, and complete payment through Razorpay or demo checkout.
          </SectionHeader>
          <div className="mb-8 rounded-lg border border-emerald-400/25 bg-emerald-500/10 p-4">
            <div className="flex items-center gap-3 font-nav text-xs font-extrabold uppercase tracking-[0.16em] text-emerald-200">
              <Activity size={17} className="animate-pulse" /> Live Availability
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {todaysSlots.map((slot) => (
                <div key={slot.id} className="rounded-lg border border-white/10 bg-captain-card p-3 text-center">
                  <div className="font-mono text-sm text-white">{slot.startTime}</div>
                  <div className={`mt-1 text-xs capitalize ${slot.status === "active" ? "text-emerald-200" : "text-white/35"}`}>
                    {slot.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-6 xl:grid-cols-[0.85fr_1fr_1fr]">
            <SlotCalendar
              selectedDate={selectedDate}
              onSelectDate={(date) => {
                setSelectedDate(date);
                setSelectedSlot(null);
              }}
            />
            <div className="rounded-lg border border-captain-gold/25 bg-captain-card p-5 shadow-gold">
              <h3 className="mb-5 font-serif text-2xl font-bold text-white">Select Time Slot</h3>
              <div className="grid gap-3">
                {slots.map((slot) => (
                  <SlotCard
                    key={slot.id}
                    slot={slot}
                    selected={selectedSlot?.id === slot.id}
                    onSelect={setSelectedSlot}
                  />
                ))}
              </div>
            </div>
            <BookingForm selectedDate={selectedDate} selectedSlot={selectedSlot} onConfirmed={setBooking} />
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
