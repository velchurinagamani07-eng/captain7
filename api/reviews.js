import { getAdminDb } from "../server/firebaseAdmin.js";

const TTL_MS = 6 * 60 * 60 * 1000;

const fallbackReviews = {
  rating: 4.5,
  totalReviews: 1600,
  reviews: [
    { name: "Sai Kumar", stars: 5, text: "Best box cricket setup in Narasaraopet.", date: "recent" },
    { name: "Harika Reddy", stars: 5, text: "Smooth party service and good ambience.", date: "recent" }
  ],
  source: "fallback"
};

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const db = getAdminDb();
  const cacheRef = db?.collection("reviewsCache").doc("cache");

  if (cacheRef) {
    const cached = await cacheRef.get();
    if (cached.exists) {
      const data = cached.data();
      const lastFetched = data.lastFetched?.toMillis?.() || data.lastFetched || 0;
      if (Date.now() - lastFetched < TTL_MS) {
        res.status(200).json({ ...data, source: "cache" });
        return;
      }
    }
  }

  const apiKey = process.env.VITE_GOOGLE_PLACES_API_KEY || process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.VITE_GOOGLE_PLACE_ID;
  if (!apiKey || !placeId) {
    res.status(200).json(fallbackReviews);
    return;
  }

  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", "rating,user_ratings_total,reviews");
  url.searchParams.set("key", apiKey);

  const response = await fetch(url);
  const payload = await response.json();
  const result = payload.result || {};
  const data = {
    rating: result.rating || fallbackReviews.rating,
    totalReviews: result.user_ratings_total || fallbackReviews.totalReviews,
    reviews:
      result.reviews?.map((review) => ({
        name: review.author_name,
        stars: review.rating,
        text: review.text,
        date: review.relative_time_description,
        profilePhotoUrl: review.profile_photo_url
      })) || fallbackReviews.reviews,
    lastFetched: Date.now()
  };

  if (cacheRef) await cacheRef.set(data, { merge: true });
  res.status(200).json(data);
}
