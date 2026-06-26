import { ChevronLeft, ChevronRight } from "lucide-react";

function toDateKey(date) {
  return date.toISOString().slice(0, 10);
}

export function SlotCalendar({ selectedDate, onSelectDate }) {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - today.getDay());
  const days = Array.from({ length: 21 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
  const todayKey = toDateKey(today);

  return (
    <div className="rounded-lg border border-captain-gold/25 bg-captain-card p-5 shadow-gold">
      <div className="mb-5 flex items-center justify-between">
        <button type="button" className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-white/70">
          <ChevronLeft size={18} />
        </button>
        <div className="text-center">
          <h3 className="font-serif text-2xl font-bold text-white">Select Date</h3>
          <p className="text-sm text-white/50">Past dates are locked automatically</p>
        </div>
        <button type="button" className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-white/70">
          <ChevronRight size={18} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-2 text-center">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="font-nav text-[10px] font-extrabold uppercase tracking-[0.12em] text-white/40">
            {day}
          </div>
        ))}
        {days.map((date) => {
          const key = toDateKey(date);
          const disabled = key < todayKey;
          const active = key === selectedDate;
          const isToday = key === todayKey;
          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              onClick={() => onSelectDate(key)}
              className={`relative aspect-square rounded-lg border font-mono text-sm font-bold transition ${
                active
                  ? "border-captain-bright bg-captain-gold text-captain-black"
                  : disabled
                    ? "border-white/5 bg-white/[0.02] text-white/18"
                    : "border-white/10 bg-captain-black text-white hover:border-captain-gold"
              }`}
            >
              {date.getDate()}
              {isToday ? <span className="absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-captain-bright" /> : null}
              {!disabled && !active ? <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-captain-gold" /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
