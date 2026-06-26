export function BrandMark({ size = "md", withText = true }) {
  const sizes = {
    sm: "h-9 w-9 text-3xl",
    md: "h-12 w-12 text-4xl",
    lg: "h-24 w-24 text-7xl"
  };

  return (
    <div className="flex items-center gap-3">
      <div
        className={`relative grid shrink-0 place-items-center rounded-full border-2 border-captain-gold bg-captain-black shadow-gold ${sizes[size]}`}
      >
        <span className="font-display leading-none text-white">7</span>
        <span className="absolute top-[36%] font-script text-[0.42em] text-captain-bright">Captain</span>
      </div>
      {withText ? (
        <div className="leading-tight">
          <div className="font-display text-2xl tracking-normal text-white md:text-3xl">CAPTAIN 7</div>
          <div className="font-nav text-[10px] font-bold uppercase tracking-[0.28em] text-captain-gold">
            Eat & Play
          </div>
        </div>
      ) : null}
    </div>
  );
}
