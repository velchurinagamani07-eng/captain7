import {
  BadgeIndianRupee,
  BarChart3,
  CalendarClock,
  Camera,
  ChefHat,
  Gift,
  Home,
  Image,
  LayoutDashboard,
  Mail,
  MessageSquare,
  PartyPopper,
  Percent,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Star,
  Trophy,
  Users
} from "lucide-react";

export const brand = {
  name: "Captain 7",
  fullName: "Captain 7 Eat & Play",
  tagline: "Eat. Play. Celebrate.",
  phone: "+91 90004 69552",
  whatsappNumber: "919000469552",
  whatsappMessage: "Hi Captain 7, I want to book!",
  restaurantAddress: "107, Bypass Road, Mahalakshmi Nagar, Narasaraopet - 522601",
  sportsAddress: "Near Integrated School, Pedda Cheruvu, Narasaraopet",
  fssai: "10123022000035",
  placeId: "",
  reviewUrl: "https://www.google.com/maps/search/?api=1&query=Captain%207%20Eat%20%26%20Play%20Narasaraopet",
  mapsEmbed:
    "https://maps.google.com/maps?q=Captain%207%20Eat%20%26%20Play%20Narasaraopet&t=&z=13&ie=UTF8&iwloc=&output=embed"
};

export const heroSlides = [
  {
    id: "cricket-nets",
    title: "CAPTAIN 7",
    kicker: "EAT - PLAY - CELEBRATE",
    image:
      "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1800&q=80",
    caption: "Floodlit cricket nets"
  },
  {
    id: "restaurant",
    title: "CAPTAIN 7",
    kicker: "EAT - PLAY - CELEBRATE",
    image:
      "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1800&q=80",
    caption: "Modern dining space"
  },
  {
    id: "party",
    title: "CAPTAIN 7",
    kicker: "EAT - PLAY - CELEBRATE",
    image:
      "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1800&q=80",
    caption: "Celebration venue"
  },
  {
    id: "food",
    title: "CAPTAIN 7",
    kicker: "EAT - PLAY - CELEBRATE",
    image:
      "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1800&q=80",
    caption: "Signature food spread"
  }
];

export const stats = [
  { label: "Google Rating", value: 4.5, suffix: " Star", decimals: 1 },
  { label: "Reviews", value: 1600, suffix: "+" },
  { label: "Locations", value: 2, suffix: "" },
  { label: "Open Daily", value: 7, suffix: " Days" }
];

export const features = [
  {
    title: "Cricket Zone",
    icon: Trophy,
    description: "Premium box cricket slots with live availability and secure reservations."
  },
  {
    title: "Premium Dining",
    icon: ChefHat,
    description: "Cafe favorites, signature bites, combos, and party-ready food service."
  },
  {
    title: "Live Events",
    icon: Star,
    description: "Screenings, community nights, celebrations, and high-energy match days."
  },
  {
    title: "Party Venue",
    icon: PartyPopper,
    description: "Curated birthday, corporate, anniversary, and team event packages."
  }
];

export const timeSlots = [
  { id: "slot-11", startTime: "11:00 AM", endTime: "12:00 PM", duration: "60 min", price: 699, maxPlayers: 12, status: "active" },
  { id: "slot-12", startTime: "12:00 PM", endTime: "1:00 PM", duration: "60 min", price: 699, maxPlayers: 12, status: "active" },
  { id: "slot-4", startTime: "4:00 PM", endTime: "5:00 PM", duration: "60 min", price: 899, maxPlayers: 12, status: "active" },
  { id: "slot-5", startTime: "5:00 PM", endTime: "6:00 PM", duration: "60 min", price: 899, maxPlayers: 12, status: "reserved" },
  { id: "slot-6", startTime: "6:00 PM", endTime: "7:00 PM", duration: "60 min", price: 999, maxPlayers: 12, status: "active" },
  { id: "slot-7", startTime: "7:00 PM", endTime: "8:00 PM", duration: "60 min", price: 1099, maxPlayers: 12, status: "booked" },
  { id: "slot-8", startTime: "8:00 PM", endTime: "9:00 PM", duration: "60 min", price: 1099, maxPlayers: 12, status: "active" },
  { id: "slot-9", startTime: "9:00 PM", endTime: "10:00 PM", duration: "60 min", price: 1099, maxPlayers: 12, status: "active" }
];

export const menuCategories = [
  "Pizza",
  "Burgers",
  "Snacks",
  "Wraps",
  "Momos",
  "Beverages",
  "Desserts",
  "Ice Creams",
  "Trdlo/Kurtos"
];

export const menuItems = [
  {
    id: "margherita",
    category: "Pizza",
    name: "Classic Margherita",
    price: 189,
    isVeg: true,
    isBestseller: true,
    rating: 4.7,
    description: "Cheese, basil, tomato sauce, and a crisp golden crust.",
    image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "peri-chicken",
    category: "Pizza",
    name: "Peri Peri Chicken Pizza",
    price: 279,
    isVeg: false,
    isBestseller: true,
    rating: 4.8,
    description: "Spicy chicken, peppers, onion, mozzarella, and peri peri drizzle.",
    image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "loaded-fries",
    category: "Snacks",
    name: "Captain Loaded Fries",
    price: 149,
    isVeg: true,
    isBestseller: true,
    rating: 4.6,
    description: "Crispy fries with cheese, herbs, jalapenos, and house sauce.",
    image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "double-burger",
    category: "Burgers",
    name: "Double Captain Burger",
    price: 229,
    isVeg: false,
    isBestseller: true,
    rating: 4.8,
    description: "Double patty burger with cheese, crunch, and smoked sauce.",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "paneer-wrap",
    category: "Wraps",
    name: "Tandoori Paneer Wrap",
    price: 159,
    isVeg: true,
    isBestseller: false,
    rating: 4.5,
    description: "Paneer tikka, onion, mint mayo, and soft toasted wrap.",
    image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "steam-momos",
    category: "Momos",
    name: "Steamed Momos",
    price: 129,
    isVeg: true,
    isBestseller: false,
    rating: 4.4,
    description: "Soft momos served with fiery chutney and creamy dip.",
    image: "https://images.unsplash.com/photo-1626776876729-bab4369a5a5a?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "sweet-trdlo",
    category: "Trdlo/Kurtos",
    name: "Nutella Sweet Trdlo",
    price: 179,
    isVeg: true,
    isBestseller: true,
    rating: 4.9,
    description: "Warm chimney cake with Nutella and sugar crunch.",
    image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "mocktail",
    category: "Beverages",
    name: "Gold Rush Mocktail",
    price: 119,
    isVeg: true,
    isBestseller: false,
    rating: 4.6,
    description: "Citrus, mint, sparkling soda, and a bright tropical finish.",
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=900&q=80"
  }
];

export const combos = [
  {
    id: "match-day-combo",
    name: "Match Day Combo",
    items: ["Loaded Fries", "2 Mocktails", "Margherita Pizza"],
    originalPrice: 577,
    price: 449,
    image: "https://images.unsplash.com/photo-1625938144755-652e08e359b7?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "team-huddle",
    name: "Team Huddle",
    items: ["2 Burgers", "Fries", "4 Drinks"],
    originalPrice: 896,
    price: 699,
    image: "https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&w=900&q=80"
  },
  {
    id: "sweet-win",
    name: "Sweet Win",
    items: ["2 Sweet Trdlo", "Ice Cream", "2 Mocktails"],
    originalPrice: 516,
    price: 399,
    image: "https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=900&q=80"
  }
];

export const partyPackages = [
  {
    id: "classic",
    name: "Classic Captain",
    tier: "Entry",
    price: 499,
    priceType: "per head",
    badge: "Smart Start",
    inclusions: ["Cafe seating", "Starter platter", "Basic decoration", "30 min cricket add-on option", "Music playlist"],
    images: [
      "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1602631985686-1bb0e6a8696e?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=600&q=80"
    ]
  },
  {
    id: "premium",
    name: "Premium Captain",
    tier: "Most Popular",
    price: 799,
    priceType: "per head",
    badge: "Most Popular",
    isMostPopular: true,
    inclusions: ["Premium food spread", "Theme decoration", "1 hour cricket slot", "Reserved lounge seating", "Host coordination"],
    images: [
      "https://images.unsplash.com/photo-1505236858219-8359eb29e329?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=600&q=80"
    ]
  },
  {
    id: "royal",
    name: "Royal Captain",
    tier: "Premium",
    price: 1299,
    priceType: "per head",
    badge: "Flagship",
    inclusions: ["Royal buffet", "Custom decoration", "2 hour cricket slot", "Photography support", "Dedicated event manager"],
    images: [
      "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=600&q=80"
    ]
  }
];

export const galleryImages = [
  { id: "g1", category: "Cricket", url: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=900&q=80", title: "Night nets", featured: true },
  { id: "g2", category: "Food", url: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80", title: "Burgers", featured: true },
  { id: "g3", category: "Events", url: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=900&q=80", title: "Celebration lights" },
  { id: "g4", category: "Venue", url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80", title: "Cafe seating" },
  { id: "g5", category: "Celebrations", url: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=900&q=80", title: "Party setup" },
  { id: "g6", category: "Cricket", url: "https://images.unsplash.com/photo-1593766788306-28561086694e?auto=format&fit=crop&w=900&q=80", title: "Practice session" },
  { id: "g7", category: "Food", url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80", title: "Signature bites" },
  { id: "g8", category: "Venue", url: "https://images.unsplash.com/photo-1559329007-40df8a9345d8?auto=format&fit=crop&w=900&q=80", title: "Restaurant floor" }
];

export const reviews = [
  { id: "r1", name: "Sai Kumar", stars: 5, date: "2 weeks ago", text: "Best box cricket setup in Narasaraopet. Food after the match was excellent." },
  { id: "r2", name: "Harika Reddy", stars: 5, date: "1 month ago", text: "Hosted a birthday party here. Smooth service, good ambience, and very helpful staff." },
  { id: "r3", name: "Rahul Varma", stars: 4, date: "1 month ago", text: "Great place for friends to play and chill. Combo offers are worth it." },
  { id: "r4", name: "Mounika", stars: 5, date: "3 months ago", text: "Clean venue, delicious snacks, and the evening cricket slots feel premium." }
];

export const festivals = [
  {
    id: "festival-demo",
    title: "Weekend Captain Carnival",
    message: "Book a cricket slot and unlock a cafe combo deal today.",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    active: true
  }
];

export const coupons = [
  { code: "CAPTAIN20", discountType: "percent", discountValue: 20, minOrder: 299, applicableTo: "all", active: true },
  { code: "PLAY100", discountType: "flat", discountValue: 100, minOrder: 799, applicableTo: "cricket", active: true }
];

export const returnCouponConfig = {
  enabled: true,
  thresholdDays: 3,
  couponCode: "WELCOME7",
  discountText: "15% OFF your next booking!",
  expiryHours: 24
};

export const chatbotFaqs = [
  {
    question: "How do I book cricket?",
    keywords: ["book", "cricket", "slot", "play"],
    answer: "Choose a date and slot on the cricket booking page. I can take you there now.",
    actionLink: "/cricket-booking"
  },
  {
    question: "Where is Captain 7?",
    keywords: ["location", "address", "map", "where"],
    answer: `Restaurant: ${brand.restaurantAddress}. Sports Zone: ${brand.sportsAddress}.`,
    actionLink: "/contact"
  },
  {
    question: "Do you have party packages?",
    keywords: ["party", "birthday", "event", "package"],
    answer: "Yes. Classic, Premium, and Royal packages are available with food, decor, and cricket add-ons.",
    actionLink: "/party-packages"
  },
  {
    question: "Tell me about franchise",
    keywords: ["franchise", "investment", "roi", "business"],
    answer: "Captain 7 franchise enquiries start at Rs. 2,50,000 with setup and brand support.",
    actionLink: "/franchise"
  }
];

export const adminNav = [
  { label: "Overview", path: "/admin", icon: LayoutDashboard },
  { label: "Bookings", path: "/admin/bookings", icon: CalendarClock },
  { label: "Time Slots", path: "/admin/time-slots", icon: Trophy },
  { label: "Food Menu", path: "/admin/food-menu", icon: ChefHat },
  { label: "Food Orders", path: "/admin/orders", icon: ShoppingBag },
  { label: "Workers", path: "/admin/workers", icon: Users },
  { label: "Festival Banners", path: "/admin/festivals", icon: Camera },
  { label: "Coupons", path: "/admin/coupons", icon: Percent },
  { label: "Analytics", path: "/admin/analytics", icon: BarChart3 },
  { label: "Settings", path: "/admin/settings", icon: Settings }
];

export const revenueData = [
  { day: "Mon", bookings: 8600, food: 4200 },
  { day: "Tue", bookings: 7400, food: 5100 },
  { day: "Wed", bookings: 9800, food: 6100 },
  { day: "Thu", bookings: 11200, food: 5700 },
  { day: "Fri", bookings: 15600, food: 9200 },
  { day: "Sat", bookings: 19800, food: 12600 },
  { day: "Sun", bookings: 17400, food: 11800 }
];

export const sampleBookings = [
  { id: "C7-2401", name: "Aditya", date: "Today", time: "6:00 PM - 7:00 PM", amount: 999, status: "confirmed" },
  { id: "C7-2402", name: "Meghana", date: "Today", time: "8:00 PM - 9:00 PM", amount: 1099, status: "pending" },
  { id: "C7-2403", name: "Karthik", date: "Tomorrow", time: "5:00 PM - 6:00 PM", amount: 899, status: "confirmed" }
];

export const franchiseBreakdown = [
  { item: "Interior setup", value: 85000 },
  { item: "Sports equipment", value: 65000 },
  { item: "Brand fee", value: 60000 },
  { item: "Working capital", value: 40000 }
];
