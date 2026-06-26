import CountUp from "react-countup";
import { useInView } from "react-intersection-observer";
import { stats } from "../../data/siteData.js";

export function StatsBar() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.35 });

  return (
    <section ref={ref} className="border-y border-captain-gold/35 bg-captain-charcoal">
      <div className="section-shell grid gap-4 py-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <div className="font-mono text-2xl font-extrabold text-captain-bright md:text-3xl">
              {inView ? (
                <CountUp end={stat.value} decimals={stat.decimals || 0} duration={1.4} suffix={stat.suffix} />
              ) : (
                `0${stat.suffix}`
              )}
            </div>
            <div className="mt-1 font-nav text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/55">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
