import { Star } from "lucide-react";
import { reviews } from "../../data/siteData.js";
import { Button } from "../ui/Button.jsx";
import { useReviewUrl } from "../../hooks/useSettings.js";

export function ReviewWidget() {
  const reviewUrl = useReviewUrl();
  return (
    <section className="bg-captain-black py-12">
      <div className="section-shell grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
        <div>
          <div className="font-nav text-xs font-extrabold uppercase tracking-[0.24em] text-captain-gold">
            Google Reviews
          </div>
          <div className="mt-4 flex items-end gap-3">
            <span className="font-display text-8xl leading-none text-white">4.5</span>
            <span className="pb-4 text-white/55">from 1600+ reviews</span>
          </div>
          <div className="mt-3 flex gap-1">
            {[0, 1, 2, 3, 4].map((star) => (
              <Star key={star} size={22} className="fill-captain-gold text-captain-gold" />
            ))}
          </div>
          <a href={reviewUrl} target="_blank" rel="noreferrer" className="mt-7 inline-block">
            <Button variant="secondary">Write A Review</Button>
          </a>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {reviews.map((review) => (
            <article key={review.id} className="rounded-lg border border-white/10 bg-captain-card p-5">
              <div className="mb-3 flex gap-1">
                {Array.from({ length: review.stars }).map((_, index) => (
                  <Star key={index} size={15} className="fill-captain-gold text-captain-gold" />
                ))}
              </div>
              <p className="text-sm leading-6 text-white/68">"{review.text}"</p>
              <div className="mt-4 font-semibold text-white">{review.name}</div>
              <div className="text-xs text-white/42">{review.date}</div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
