import { chatbotFaqs } from "../data/siteData.js";

export function matchIntent(input) {
  const normalized = String(input || "").toLowerCase();
  const rules = [
    {
      keys: ["book", "cricket", "slot", "turf", "net", "pitch"],
      answer: "You can book a Captain 7 cricket slot by choosing a date, selecting an available time, and completing payment.",
      actionLink: "/cricket-booking"
    },
    {
      keys: ["food", "menu", "pizza", "burger", "eat", "hungry"],
      answer: "Our menu includes pizzas, burgers, signature bites, momos, wraps, beverages, ice creams, and combos.",
      actionLink: "/food-menu"
    },
    {
      keys: ["party", "birthday", "event", "celebrate", "package"],
      answer: "Captain 7 has party packages for birthdays, corporate events, anniversaries, and team celebrations.",
      actionLink: "/party-packages"
    },
    {
      keys: ["gallery", "photos", "pictures", "venue", "look"],
      answer: "You can view cricket, food, event, celebration, and venue photos in our gallery.",
      actionLink: "/gallery"
    },
    {
      keys: ["hours", "timing", "open", "close", "when"],
      answer: "Restaurant: 11AM-11PM. Sports Zone: Mon 4PM-10:30PM, Tue-Sun 11AM-10:30PM.",
      actionLink: "/contact"
    },
    {
      keys: ["location", "address", "where", "directions"],
      answer: "Restaurant: 107, Bypass Road, Mahalakshmi Nagar. Sports Zone: Near Integrated School, Pedda Cheruvu.",
      actionLink: "/contact"
    },
    {
      keys: ["price", "cost", "rate", "how much", "fee"],
      answer: "Cricket slots usually range from Rs. 699 to Rs. 1099 per hour. Food items and combos are shown in the menu.",
      actionLink: "/food-menu"
    },
    {
      keys: ["contact", "phone", "call", "whatsapp", "reach"],
      answer: "Call or WhatsApp Captain 7 at +91 90004 69552.",
      actionLink: "/contact"
    },
    {
      keys: ["franchise", "invest", "own", "partner", "2.5", "lakh"],
      answer: "Captain 7 franchise opportunities start at Rs. 2.5 lakhs with brand and setup support.",
      actionLink: "/franchise"
    },
    {
      keys: ["coupon", "discount", "offer", "deal"],
      answer: "Coupons are available for return visitors, menu orders, cricket bookings, and combo offers when active.",
      actionLink: "/food-menu"
    },
    {
      keys: ["hi", "hello", "hey", "namaste"],
      answer: "Hey! I'm Captain 7's assistant. Ask me about bookings, food, parties, location, or anything else!",
      actionLink: null
    }
  ];
  const direct = rules.find((rule) => rule.keys.some((keyword) => normalized.includes(keyword)));
  if (direct) return direct;
  const match = chatbotFaqs.find((faq) => faq.keywords.some((keyword) => normalized.includes(keyword)));
  return (
    match || {
      answer: "I'm not sure about that. Want to talk to our team?",
      actionLink: "/contact"
    }
  );
}
