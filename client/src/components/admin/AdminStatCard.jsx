export function AdminStatCard({ label, value, delta, icon: Icon }) {
  return (
    <article className="rounded-lg border border-captain-gold/25 bg-captain-card p-5 shadow-gold">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-nav text-xs font-extrabold uppercase tracking-[0.14em] text-white/45">{label}</div>
          <div className="mt-3 font-mono text-3xl font-extrabold text-captain-bright">{value}</div>
          {delta ? <div className="mt-2 text-sm text-emerald-200">{delta}</div> : null}
        </div>
        {Icon ? (
          <span className="grid h-11 w-11 place-items-center rounded-full border border-captain-gold/30 bg-captain-gold/10 text-captain-bright">
            <Icon size={20} />
          </span>
        ) : null}
      </div>
    </article>
  );
}
