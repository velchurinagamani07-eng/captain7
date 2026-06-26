import { getAdminDb } from "./firebaseAdmin.js";

const menuItems = [
  // Pizza
  { name: "Classic Veg Pizza", category: "Pizza", price: 149, isVeg: true, isAvailable: true, isBestseller: false, rating: 4.5, description: "Classic tomato base, loaded with fresh cheese and traditional herbs.", image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=900&q=80", order: 1, isActive: true },
  { name: "Corn and Cheese Pizza", category: "Pizza", price: 224, isVeg: true, isAvailable: true, isBestseller: false, rating: 4.6, description: "Sweet golden corn paired with extra gooey liquid cheese.", image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=900&q=80", order: 2, isActive: true },
  { name: "Paneer Pizza", category: "Pizza", price: 269, isVeg: true, isAvailable: true, isBestseller: false, rating: 4.7, description: "Cottage cheese chunks with capsicum, onions and mozzarella.", image: "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=900&q=80", order: 3, isActive: true },
  { name: "Barbeque Veg Pizza", category: "Pizza", price: 269, isVeg: true, isAvailable: true, isBestseller: false, rating: 4.5, description: "Sweet and smoky BBQ sauce base with chargrilled veggies.", image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=900&q=80", order: 4, isActive: true },
  { name: "Tandoori Veg Pizza", category: "Pizza", price: 269, isVeg: true, isAvailable: true, isBestseller: false, rating: 4.6, description: "Spiced tandoori paneer, red onions, capsicum, and tikka sauce.", image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=80", order: 5, isActive: true },
  { name: "Exotic Veg Pizza", category: "Pizza", price: 299, isVeg: true, isAvailable: true, isBestseller: false, rating: 4.8, description: "Baby corn, olives, jalapenos, mushrooms, and bell peppers.", image: "https://images.unsplash.com/photo-1571066811602-71683a3f680d?auto=format&fit=crop&w=900&q=80", order: 6, isActive: true },

  // Snacks
  { name: "Crispy Chicken Fried Legs", category: "Snacks", price: 178, isVeg: false, isAvailable: true, isBestseller: false, rating: 4.7, description: "Golden fried juicy chicken drumsticks with Captain's hot seasoning.", image: "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=900&q=80", order: 7, isActive: true },
  { name: "Crispy Chicken Fried Wings", category: "Snacks", price: 200, isVeg: false, isAvailable: true, isBestseller: false, rating: 4.6, description: "Crispy outer layer, tender chicken wings inside, tossed with spices.", image: "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=900&q=80", order: 8, isActive: true },
  { name: "Crispy Chicken Fried Strips", category: "Snacks", price: 200, isVeg: false, isAvailable: true, isBestseller: false, rating: 4.5, description: "Boneless chicken strips fried to a perfect crunch, served with dip.", image: "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?auto=format&fit=crop&w=900&q=80", order: 9, isActive: true },
  { name: "Crispy Chicken Fried Popcorn", category: "Snacks", price: 200, isVeg: false, isAvailable: true, isBestseller: false, rating: 4.8, description: "Bite-sized chicken nuggets seasoned with signature Captain pepper.", image: "https://images.unsplash.com/photo-1541532713592-79a0317b6b77?auto=format&fit=crop&w=900&q=80", order: 10, isActive: true },
  { name: "Chicken Nuggets", category: "Snacks", price: 223, isVeg: false, isAvailable: true, isBestseller: false, rating: 4.4, description: "Ground chicken patties crisp-fried, served with garlic mayo.", image: "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?auto=format&fit=crop&w=900&q=80", order: 11, isActive: true },
  { name: "Chicken Cheese Balls", category: "Snacks", price: 223, isVeg: false, isAvailable: true, isBestseller: false, rating: 4.7, description: "Minced chicken balls filled with molten cheddar cheese.", image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80", order: 12, isActive: true },
  { name: "Crispy Fish Fingers", category: "Snacks", price: 290, isVeg: false, isAvailable: true, isBestseller: false, rating: 4.8, description: "Fresh fish fillets cut into strips, breaded and deep fried.", image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=900&q=80", order: 13, isActive: true },
  { name: "Crispy Prawns", category: "Snacks", price: 290, isVeg: false, isAvailable: true, isBestseller: false, rating: 4.9, description: "Crunchy batter coated golden prawns with sweet chili dip.", image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=900&q=80", order: 14, isActive: true },
  { name: "Veg Nuggets", category: "Snacks", price: 149, isVeg: true, isAvailable: true, isBestseller: false, rating: 4.3, description: "Mixed vegetables mashed and crumb-fried, classic snack.", image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=900&q=80", order: 15, isActive: true },
  { name: "Classic Salted Fries", category: "Snacks", price: 119, isVeg: true, isAvailable: true, isBestseller: true, rating: 4.8, description: "Golden, crispy French fries salted to perfection.", image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=900&q=80", order: 16, isActive: true },
  { name: "Lemon Pepper Fries", category: "Snacks", price: 134, isVeg: true, isAvailable: true, isBestseller: false, rating: 4.4, description: "Crispy fries dusted with refreshing lemon zest and ground pepper.", image: "https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=900&q=80", order: 17, isActive: true },
  { name: "Classic Italian Fries", category: "Snacks", price: 134, isVeg: true, isAvailable: true, isBestseller: false, rating: 4.5, description: "Fries coated with Italian herbs like oregano, rosemary and cheese.", image: "https://images.unsplash.com/photo-1585109649139-366815a0d713?auto=format&fit=crop&w=900&q=80", order: 18, isActive: true },
  { name: "Jamaican Jerk Fries", category: "Snacks", price: 134, isVeg: true, isAvailable: true, isBestseller: false, rating: 4.4, description: "Spicy and aromatic Caribbean jerk seasoning on standard fries.", image: "https://images.unsplash.com/photo-1585109649139-366815a0d713?auto=format&fit=crop&w=900&q=80", order: 19, isActive: true },
  { name: "Peri Peri Fries", category: "Snacks", price: 149, isVeg: true, isAvailable: true, isBestseller: false, rating: 4.7, description: "Crispy fries tossed in hot and spicy African peri-peri seasoning.", image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=900&q=80", order: 20, isActive: true },

  // Wraps
  { name: "Corn and Onion Wrap", category: "Wraps", price: 134, isVeg: true, isAvailable: true, isBestseller: false, rating: 4.4, description: "Sweet corn and crunchy onions wrapped in a soft grilled tortilla.", image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=900&q=80", order: 21, isActive: true },
  { name: "Paneer Tikka Wrap", category: "Wraps", price: 164, isVeg: true, isAvailable: true, isBestseller: false, rating: 4.7, description: "Spiced cottage cheese tikka rolled with green chutney.", image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=900&q=80", order: 22, isActive: true },
  { name: "Tandoori Veg Wrap", category: "Wraps", price: 164, isVeg: true, isAvailable: true, isBestseller: false, rating: 4.5, description: "Mix vegetables tossed in smoky tandoori sauce, rolled in flatbread.", image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=900&q=80", order: 23, isActive: true },
  { name: "Spicy Paneer Wrap", category: "Wraps", price: 179, isVeg: true, isAvailable: true, isBestseller: false, rating: 4.6, description: "Crispy paneer strips with fiery hot sauce, lettuce, and onions.", image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=900&q=80", order: 24, isActive: true },
  { name: "Cheese Relaxo Wrap", category: "Wraps", price: 209, isVeg: true, isAvailable: true, isBestseller: false, rating: 4.6, description: "A cheese-lover's paradise, loaded with double cheese and herbs.", image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=900&q=80", order: 25, isActive: true },

  // Momos
  { name: "Paneer Steamed Momos 6pc", category: "Momos", price: 150, isVeg: true, isAvailable: true, isBestseller: false, rating: 4.6, description: "Delicate dumplings stuffed with seasoned grated paneer, steamed.", image: "https://images.unsplash.com/photo-1626776876729-bab4369a5a5a?auto=format&fit=crop&w=900&q=80", order: 26, isActive: true },
  { name: "Paneer Fried Momos 6pc", category: "Momos", price: 180, isVeg: true, isAvailable: true, isBestseller: false, rating: 4.7, description: "Crunchy fried momos stuffed with delicious cottage cheese.", image: "https://images.unsplash.com/photo-1626776876729-bab4369a5a5a?auto=format&fit=crop&w=900&q=80", order: 27, isActive: true },

  // Ice Creams
  { name: "Vanilla Ice Cream Scoop", category: "Ice Creams", price: 105, isVeg: true, isAvailable: true, isBestseller: true, rating: 4.8, description: "Classic, creamy madagascar vanilla bean ice cream scoop.", image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=900&q=80", order: 28, isActive: true },
  { name: "Pista Ice Cream", category: "Ice Creams", price: 105, isVeg: true, isAvailable: true, isBestseller: true, rating: 4.7, description: "Real pistachio flavored ice cream loaded with chopped nuts.", image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=900&q=80", order: 29, isActive: true },

  // Trdlo/Kurtos
  { name: "Classic Caramel Trodlo", category: "Trdlo/Kurtos", price: 150, isVeg: true, isAvailable: true, isBestseller: false, rating: 4.8, description: "Hungarian chimney cake baked with a crunchy caramelized sugar crust.", image: "https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=900&q=80", order: 30, isActive: true },

  // Beverages
  { name: "Lemon and Mint Mojito", category: "Beverages", price: 149, isVeg: true, isAvailable: true, isBestseller: false, rating: 4.5, description: "Muddled mint leaves, lemon juice, sparkling soda and ice.", image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=900&q=80", order: 31, isActive: true },
  { name: "Blue Curacao Mocktail", category: "Beverages", price: 149, isVeg: true, isAvailable: true, isBestseller: false, rating: 4.6, description: "Tangy blue curacao syrup mixed with citrus juice and soda.", image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=900&q=80", order: 32, isActive: true },
  { name: "Blueberry Mocktail", category: "Beverages", price: 149, isVeg: true, isAvailable: true, isBestseller: false, rating: 4.4, description: "Real blueberry extracts muddled with fresh mint and sparkling soda.", image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=900&q=80", order: 33, isActive: true },
  { name: "Cold Coffee", category: "Beverages", price: 134, isVeg: true, isAvailable: true, isBestseller: false, rating: 4.7, description: "Rich blended coffee milk shake topped with chocolate drizzle.", image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=900&q=80", order: 34, isActive: true },
  { name: "Mineral Water", category: "Beverages", price: 25, isVeg: true, isAvailable: true, isBestseller: false, rating: 4.5, description: "1 Liter chilled packaged mineral drinking water.", image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=900&q=80", order: 35, isActive: true },
  { name: "Rasp Berry Mocktail", category: "Beverages", price: 149, isVeg: true, isAvailable: true, isBestseller: false, rating: 4.6, description: "Sweet raspberry crush mixed with lime and club soda.", image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=900&q=80", order: 36, isActive: true }
];

const db = getAdminDb();
if (!db) {
  console.error("Firebase Admin env values are required.");
  process.exit(1);
}

try {
  // First clear current items
  const current = await db.collection("menuItems").get();
  const deleteBatch = db.batch();
  current.docs.forEach((doc) => deleteBatch.delete(doc.ref));
  await deleteBatch.commit();
  console.log("Cleared existing menu items.");

  // Seed new ones
  const batch = db.batch();
  menuItems.forEach((item) => {
    const ref = db.collection("menuItems").doc();
    batch.set(ref, { ...item, createdAt: new Date() });
  });
  await batch.commit();
  console.log("Seeded Zomato menu items successfully.");
} catch (err) {
  console.error("Error seeding menu:", err);
}
