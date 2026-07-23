import { lazy, Suspense, useEffect, useState } from "react";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Navbar } from "./components/common/Navbar.jsx";
import { AnnouncementBar } from "./components/common/AnnouncementBar.jsx";
import { Footer } from "./components/common/Footer.jsx";
import { FloatingActions } from "./components/common/FloatingActions.jsx";
import { MobileNav } from "./components/common/MobileNav.jsx";
import { MobileHeader } from "./components/common/MobileHeader.jsx";
import { SplashScreen } from "./components/common/SplashScreen.jsx";
import { LoadingScreen } from "./components/common/LoadingScreen.jsx";
import { ReturnCouponPopup } from "./components/common/ReturnCouponPopup.jsx";
import { ChatbotWidget } from "./components/chatbot/ChatbotWidget.jsx";
import { CartDrawer } from "./components/menu/CartDrawer.jsx";
import { useAuth } from "./hooks/useAuth.js";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase.js";

const Home = lazy(() => import("./pages/Home.jsx"));
const CricketBooking = lazy(() => import("./pages/CricketBooking.jsx"));
const FoodMenu = lazy(() => import("./pages/FoodMenu.jsx"));
const PartyPackages = lazy(() => import("./pages/PartyPackages.jsx"));
const Gallery = lazy(() => import("./pages/Gallery.jsx"));
const Contact = lazy(() => import("./pages/Contact.jsx"));
const Franchise = lazy(() => import("./pages/Franchise.jsx"));
const Login = lazy(() => import("./pages/Login.jsx"));
const NotFound = lazy(() => import("./pages/NotFound.jsx"));
const Invoice = lazy(() => import("./pages/Invoice.jsx"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout.jsx"));
const AdminOverview = lazy(() => import("./pages/admin/AdminOverview.jsx"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard.jsx"));
const AdminBookings = lazy(() => import("./pages/admin/AdminBookings.jsx"));
const AdminTimeSlots = lazy(() => import("./pages/admin/AdminTimeSlots.jsx"));
const AdminSlots = lazy(() => import("./pages/admin/AdminSlots.jsx"));
const AdminFoodMenu = lazy(() => import("./pages/admin/AdminFoodMenu.jsx"));
const AdminMenu = lazy(() => import("./pages/admin/AdminMenu.jsx"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders.jsx"));
const AdminCombos = lazy(() => import("./pages/admin/AdminCombos.jsx"));
const AdminPartyPackages = lazy(() => import("./pages/admin/AdminPartyPackages.jsx"));
const AdminGallery = lazy(() => import("./pages/admin/AdminGallery.jsx"));
const AdminHomeContent = lazy(() => import("./pages/admin/AdminHomeContent.jsx"));
const AdminHero = lazy(() => import("./pages/admin/AdminHero.jsx"));
const AdminFestivalBanners = lazy(() => import("./pages/admin/AdminFestivalBanners.jsx"));
const AdminBanners = lazy(() => import("./pages/admin/AdminBanners.jsx"));
const AdminAnnouncements = lazy(() => import("./pages/admin/AdminAnnouncements.jsx"));
const AdminCoupons = lazy(() => import("./pages/admin/AdminCoupons.jsx"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings.jsx"));
const AdminContact = lazy(() => import("./pages/admin/AdminContact.jsx"));
const AdminHomepage = lazy(() => import("./pages/admin/AdminHomepage.jsx"));

const WorkerLogin = lazy(() => import("./pages/WorkerLogin.jsx"));
const WorkerDashboard = lazy(() => import("./pages/WorkerDashboard.jsx"));
const AdminWorkers = lazy(() => import("./pages/admin/AdminWorkers.jsx"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics.jsx"));
const CustomerMenu = lazy(() => import("./pages/CustomerMenu.jsx"));
const KitchenDashboard = lazy(() => import("./pages/KitchenDashboard.jsx"));
const AdminTables = lazy(() => import("./pages/admin/AdminTables.jsx"));

export default function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isWorkerRoute = location.pathname.startsWith("/worker");
  const isFranchiseLanding = location.pathname === "/franchise";
  const isMenuRoute = location.pathname.startsWith("/menu");
  const isKitchenRoute = location.pathname.startsWith("/kitchen");
  const isQrRoute = location.pathname.startsWith("/qr-codes");
  const showPublicChrome = !isAdminRoute && !isWorkerRoute && !isFranchiseLanding && !isMenuRoute && !isKitchenRoute && !isQrRoute;
  const [routeLoading, setRouteLoading] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setRouteLoading(true);
    const timer = setTimeout(() => setRouteLoading(false), 400);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  useEffect(() => {
    const trackPageView = async () => {
      if (!db) return;
      try {
        const deviceType = /Mobi|Android|iPhone/i.test(navigator.userAgent) ? "mobile" : "desktop";
        let browser = "Other";
        const ua = navigator.userAgent;
        if (ua.includes("Firefox")) browser = "Firefox";
        else if (ua.includes("Chrome")) browser = "Chrome";
        else if (ua.includes("Safari")) browser = "Safari";
        else if (ua.includes("Edge")) browser = "Edge";

        let sessionId = sessionStorage.getItem("captain7:sessionId");
        if (!sessionId) {
          sessionId = Math.random().toString(36).substring(2, 15);
          sessionStorage.setItem("captain7:sessionId", sessionId);
        }

        await addDoc(collection(db, "pageViews"), {
          path: location.pathname,
          timestamp: serverTimestamp(),
          deviceType,
          browser,
          referrer: document.referrer || "direct",
          sessionId
        });
      } catch (err) {
        console.warn("Failed to track page view:", err);
      }
    };
    trackPageView();
  }, [location.pathname]);

  return (
    <>
      <SplashScreen />
      <LoadingScreen active={routeLoading} />
      {showPublicChrome ? (
        <>
          {!location.search.includes("table=") ? <AnnouncementBar /> : null}
          <Navbar />
          <MobileHeader />
        </>
      ) : null}
      <Suspense fallback={<LoadingScreen active />}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>

            {/* Public auth pages - no login required */}
            <Route path="/admin/login" element={<Login />} />
            <Route path="/worker/login" element={<WorkerLogin />} />

            {/* Public customer pages - no login required */}
            <Route path="/" element={<Home />} />
            <Route path="/menu" element={<CustomerMenu />} />
            <Route path="/kitchen" element={<KitchenDashboard />} />
            <Route path="/qr-codes" element={<AdminTables />} />
            <Route path="/invoice/:orderId" element={<Invoice />} />
            <Route path="/cricket-booking" element={<CricketBooking />} />
            <Route path="/food-menu" element={<FoodMenu />} />
            <Route path="/party-packages" element={<PartyPackages />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/franchise" element={<Franchise />} />

            {/* Worker dashboard */}
            <Route element={<WorkerRoute />}>
              <Route path="/worker/dashboard" element={<WorkerDashboard />} />
            </Route>

            {/* Admin pages - admin role required */}
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminOverview />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="bookings" element={<AdminBookings />} />
                <Route path="time-slots" element={<AdminTimeSlots />} />
                <Route path="slots" element={<AdminSlots />} />
                <Route path="food-menu" element={<AdminFoodMenu />} />
                <Route path="menu" element={<AdminMenu />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="combos" element={<AdminCombos />} />
                <Route path="party-packages" element={<AdminPartyPackages />} />
                <Route path="party" element={<AdminPartyPackages />} />
                <Route path="gallery" element={<AdminGallery />} />
                <Route path="home-content" element={<AdminHomeContent />} />
                <Route path="homepage" element={<AdminHomepage />} />
                <Route path="hero" element={<AdminHero />} />
                <Route path="festivals" element={<AdminFestivalBanners />} />
                <Route path="banners" element={<AdminBanners />} />
                <Route path="announcements" element={<AdminAnnouncements />} />
                <Route path="coupons" element={<AdminCoupons />} />
                <Route path="workers" element={<AdminWorkers />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="tables" element={<AdminTables />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AnimatePresence>
      </Suspense>
      {showPublicChrome ? (
        <>
          <CartDrawer />
          <ChatbotWidget />
          <FloatingActions />
          <MobileNav />
          <ReturnCouponPopup />
          <Footer />
        </>
      ) : null}
    </>
  );
}

function AdminRoute() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen active />;
  if (!user) return <Navigate to="/admin/login" replace />;
  if (user.role !== "admin") return <Navigate to="/" replace />;
  return <Outlet />;
}

function WorkerRoute() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen active />;
  if (!user) return <Navigate to="/worker/login" replace />;
  if (user.role !== "worker") return <Navigate to="/worker/login" replace />;
  return <Outlet />;
}