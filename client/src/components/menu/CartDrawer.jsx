import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, Minus, Plus, ShoppingBag, Trash2, X, MapPin } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { addDoc, collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../../firebase.js";
import { useCart } from "../../hooks/useCart.js";
import { formatCurrency } from "../../utils/formatCurrency.js";
import { googleMapsSearchUrl } from "../../utils/maps.js";
import { openOwnerWhatsApp } from "../../utils/whatsapp.js";
import { Button } from "../ui/Button.jsx";
import { Spinner } from "../ui/Spinner.jsx";
import { Toast } from "../ui/Toast.jsx";
import { useSettingDoc } from "../../hooks/useSettings.js";

const DEFAULT_CITY = "Narasaraopet";

function isDeliverableAddress(address) {
  const value = address.toLowerCase();
  return value.includes("narasaraopet") || value.includes("narasarao pet") || value.includes("narasaraopeta");
}

function buildFullAddress({ flatNo, buildingName, area, city }) {
  return [flatNo, buildingName, area, city].map((part) => part.trim()).filter(Boolean).join(", ");
}

export function CartDrawer() {
  const {
    items,
    open,
    setOpen,
    itemCount,
    updateQuantity,
    removeItem,
    subtotal,
    gst,
    discount,
    total,
    couponCode,
    setCouponCode,
    applyCoupon,
    couponResult,
    clearCart
  } = useCart();
  const location = useLocation();
  const [step, setStep] = useState("cart");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [flatNo, setFlatNo] = useState("");
  const [buildingName, setBuildingName] = useState("");
  const [area, setArea] = useState("");
  const [city] = useState(DEFAULT_CITY);
  const [orderId, setOrderId] = useState("");
  const [orderAddress, setOrderAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState("");
  const showButton = location.pathname === "/food-menu" || itemCount > 0;

  const { data: apiKeys } = useSettingDoc("apiKeys", {});
  const [coordinates, setCoordinates] = useState(null);
  const [detecting, setDetecting] = useState(false);

  const handleAutoDetect = () => {
    if (!navigator.geolocation) {
      triggerToast("Geolocation is not supported by your browser");
      return;
    }
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoordinates({ latitude, longitude });
        
        const googleMapsApiKey = apiKeys?.googleMapsApiKey || "";
        
        try {
          if (googleMapsApiKey) {
            const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${googleMapsApiKey}`);
            const data = await res.json();
            if (data.results && data.results.length > 0) {
              const addressComponents = data.results[0].address_components;
              
              let foundFlat = "";
              let foundBuilding = "";
              let foundStreet = "";
              
              addressComponents.forEach(comp => {
                if (comp.types.includes("subpremise") || comp.types.includes("premise")) {
                  foundFlat = comp.long_name;
                } else if (comp.types.includes("neighborhood") || comp.types.includes("sublocality")) {
                  foundBuilding = comp.long_name;
                } else if (comp.types.includes("route") || comp.types.includes("sublocality_level_1")) {
                  foundStreet = comp.long_name;
                }
              });
              
              setFlatNo(foundFlat || "Flat/House Detected");
              setBuildingName(foundBuilding || "");
              setArea(foundStreet || data.results[0].formatted_address);
              triggerToast("Location auto-detected successfully!");
              return;
            }
          }
          
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`);
          const data = await res.json();
          if (data && data.address) {
            const addr = data.address;
            setFlatNo(addr.house_number || "House Detected");
            setBuildingName(addr.neighbourhood || addr.suburb || "");
            setArea(addr.road || addr.subdivision || data.display_name || "");
            triggerToast("Location auto-detected via OpenStreetMap!");
          } else {
            triggerToast("Failed to reverse-geocode coordinates");
          }
        } catch (err) {
          triggerToast("Failed to resolve address: " + err.message);
        } finally {
          setDetecting(false);
        }
      },
      (err) => {
        console.error(err);
        triggerToast("Failed to retrieve geolocation coordinate: " + err.message);
        setDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const cartItems = useMemo(
    () =>
      items.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        lineTotal: item.price * item.quantity
      })),
    [items]
  );

  function triggerToast(message) {
    setToast(message);
    setTimeout(() => setToast(""), 3000);
  }

  const handleCheckout = () => {
    if (!items.length) return;
    setStep("checkout");
  };

  const searchParams = new URLSearchParams(location.search);
  const tableParam = searchParams.get("table");
  const tableNumber = tableParam ? Number(tableParam) : null;

  const placeOrder = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      if (tableNumber) {
        // Table Dine-In Order -> Save to tableOrders collection
        const tableOrderPayload = {
          tableNumber: Number(tableNumber),
          tableId: `table-${tableNumber}`,
          orderNumber: Math.floor(100 + Math.random() * 900),
          items: cartItems.map((it) => ({
            itemId: it.id,
            name: it.name,
            price: it.price,
            quantity: it.quantity,
            isVeg: Boolean(it.isVeg),
            specialNote: ""
          })),
          subtotal,
          gst,
          total,
          status: "pending",
          source: "dine-in",
          customerNote: customerName ? `Customer: ${customerName}` : "",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        await addDoc(collection(db, "tableOrders"), tableOrderPayload);

        await addDoc(collection(db, "notifications"), {
          type: "new_table_order",
          title: "New Table Order",
          message: `Table ${tableNumber} placed a dine-in order for ${formatCurrency(total)}`,
          link: "/admin/orders",
          isRead: false,
          createdAt: serverTimestamp(),
          targetRole: "admin"
        });

        clearCart();
        setOrderId(`Table ${tableNumber}`);
        setStep("success");
        return;
      }

      const fullAddress = buildFullAddress({ flatNo, buildingName, area, city });

      if (!customerName.trim() || !customerPhone.trim() || !flatNo.trim() || !area.trim()) {
        triggerToast("Name, phone, flat/house no, and area are required");
        setSubmitting(false);
        return;
      }

      if (!isDeliverableAddress(`${fullAddress} ${city}`)) {
        triggerToast("Sorry we only deliver within Narasaraopet currently");
        setSubmitting(false);
        return;
      }

      const generatedId = `C7${Date.now().toString().slice(-5)}`;
      const orderRef = doc(db, "orders", generatedId);

      const orderPayload = {
        id: generatedId,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        flatNo: flatNo.trim(),
        buildingName: buildingName.trim(),
        area: area.trim(),
        city,
        fullAddress,
        items: cartItems,
        subtotal,
        gst,
        discount,
        total,
        status: "pending",
        assignedTo: "",
        workerName: "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        acceptedAt: null,
        pickedUpAt: null,
        deliveredAt: null,
        coordinates: coordinates || null
      };

      await setDoc(orderRef, orderPayload);

      await setDoc(doc(db, "foodOrders", generatedId), {
        id: generatedId,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        flatNo: flatNo.trim(),
        buildingName: buildingName.trim(),
        area: area.trim(),
        city,
        fullAddress,
        items: cartItems,
        subtotal,
        gst,
        discount,
        total,
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        coordinates: coordinates || null
      });

      await addDoc(collection(db, "notifications"), {
        type: "new_order",
        title: "New Order Placed",
        message: `Food order #${generatedId} of ${formatCurrency(total)} has been placed.`,
        link: "/admin/orders",
        isRead: false,
        createdAt: serverTimestamp(),
        targetRole: "admin"
      });

      openOwnerWhatsApp(
        `New Captain 7 food order #${generatedId}. Name: ${customerName}. Phone: ${customerPhone}. Address: ${fullAddress}. Items: ${cartItems
          .map((item) => `${item.name} x${item.quantity}`)
          .join(", ")}. Total: ${formatCurrency(total)}`
      );

      clearCart();
      setOrderId(generatedId);
      setOrderAddress(fullAddress);
      setStep("success");
    } catch (error) {
      triggerToast(error.message || "Failed to place order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const closeDrawer = () => {
    setOpen(false);
    if (step === "success") {
      setStep("cart");
      setCustomerName("");
      setCustomerPhone("");
      setFlatNo("");
      setBuildingName("");
      setArea("");
      setOrderId("");
      setOrderAddress("");
    }
  };

  return (
    <>
      {showButton ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-40 right-5 z-40 grid h-14 w-14 place-items-center rounded-full border border-captain-gold bg-captain-black text-captain-bright shadow-gold md:bottom-[16rem]"
          aria-label="Open cart"
        >
          <ShoppingBag size={22} />
          {itemCount ? (
            <span className="absolute -right-1 -top-1 grid h-6 min-w-6 place-items-center rounded-full bg-captain-gold px-1 font-mono text-xs font-extrabold text-captain-black">
              {itemCount}
            </span>
          ) : null}
        </button>
      ) : null}

      <AnimatePresence>
        {open ? (
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.28 }}
            className="fixed inset-y-0 right-0 z-[85] flex w-[min(460px,100vw)] flex-col border-l border-captain-gold/25 bg-captain-charcoal shadow-gold-strong"
          >
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <div>
                <h2 className="font-serif text-2xl font-bold text-white">
                  {step === "cart" ? "Your Cart" : step === "checkout" ? "Checkout" : "Order Confirmed"}
                </h2>
                {step === "cart" ? <p className="text-sm text-white/50">{itemCount} items selected</p> : null}
              </div>
              <button
                type="button"
                onClick={closeDrawer}
                className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-white/70 hover:border-captain-gold hover:text-captain-gold"
                aria-label="Close cart"
              >
                <X size={18} />
              </button>
            </div>

            {step === "cart" ? (
              <>
                <div className="flex-1 overflow-auto p-5">
                  {items.length ? (
                    <div className="grid gap-4">
                      {items.map((item) => (
                        <div key={item.id} className="rounded-lg border border-white/10 bg-captain-black/60 p-4">
                          <div className="flex justify-between gap-3">
                            <div>
                              <h3 className="font-semibold text-white">{item.name}</h3>
                              <p className="mt-1 font-mono text-sm text-captain-bright">{formatCurrency(item.price)}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="grid h-9 w-9 place-items-center rounded-full border border-red-400/30 text-red-200"
                              aria-label={`Remove ${item.name}`}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <div className="mt-4 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="grid h-9 w-9 place-items-center rounded-full border border-white/10"
                              aria-label="Decrease quantity"
                            >
                              <Minus size={16} />
                            </button>
                            <span className="grid h-9 min-w-11 place-items-center rounded-full bg-white/5 font-mono text-sm">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="grid h-9 w-9 place-items-center rounded-full border border-white/10"
                              aria-label="Increase quantity"
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid min-h-[260px] place-items-center rounded-lg border border-dashed border-captain-gold/35 text-center">
                      <div>
                        <ShoppingBag className="mx-auto mb-3 text-captain-gold" />
                        <p className="text-white/60">Your Captain cart is empty.</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="border-t border-white/10 p-5">
                  <div className="mb-4 flex gap-2">
                    <input
                      value={couponCode}
                      onChange={(event) => setCouponCode(event.target.value)}
                      className="min-w-0 flex-1 rounded-full border border-white/10 bg-captain-black px-4 py-3 text-sm text-white outline-none focus:border-captain-gold"
                      placeholder="Coupon code"
                    />
                    <button
                      type="button"
                      onClick={() => applyCoupon()}
                      className="rounded-full border border-captain-gold px-4 py-3 font-nav text-xs font-extrabold uppercase tracking-[0.12em] text-captain-gold"
                    >
                      Apply
                    </button>
                  </div>
                  {couponResult ? (
                    <p className={`mb-3 text-sm ${couponResult.valid ? "text-emerald-200" : "text-red-200"}`}>
                      {couponResult.message}
                    </p>
                  ) : null}
                  <div className="grid gap-2 text-sm text-white/65">
                    <Row label="Subtotal" value={formatCurrency(subtotal)} />
                    <Row label="Discount" value={`- ${formatCurrency(discount)}`} />
                    <Row label="GST" value={formatCurrency(gst)} />
                    <Row label="Total" value={formatCurrency(total)} strong />
                  </div>
                  <Button disabled={!items.length} onClick={handleCheckout} className="mt-5 w-full">
                    Proceed to Checkout
                  </Button>
                </div>
              </>
            ) : step === "checkout" ? (
              <form onSubmit={placeOrder} className="flex min-h-0 flex-1 flex-col justify-between overflow-hidden">
                <div className="flex-1 space-y-4 overflow-auto p-5">
                  <div className="rounded-lg border border-captain-gold/20 bg-captain-black/40 p-4">
                    <Row label="Total Items" value={String(itemCount)} />
                    <Row label="Payable Amount" value={formatCurrency(total)} strong />
                  </div>

                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-lg font-bold text-white">Delivery Details</h3>
                    <button
                      type="button"
                      onClick={handleAutoDetect}
                      disabled={detecting}
                      className="inline-flex items-center gap-1.5 text-xs text-captain-gold hover:underline"
                    >
                      <MapPin size={14} className={detecting ? "animate-bounce" : ""} />
                      {detecting ? "Locating..." : "Use My Location"}
                    </button>
                  </div>

                  <Field label="Customer Name">
                    <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} className="form-input w-full" required />
                  </Field>
                  <Field label="Phone Number">
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(event) => setCustomerPhone(event.target.value)}
                      className="form-input w-full"
                      placeholder="90004 69552"
                      required
                    />
                  </Field>
                  <Field label="Flat No / House No">
                    <input value={flatNo} onChange={(event) => setFlatNo(event.target.value)} className="form-input w-full" required />
                  </Field>
                  <Field label="Building Name / Landmark">
                    <input value={buildingName} onChange={(event) => setBuildingName(event.target.value)} className="form-input w-full" />
                  </Field>
                  <Field label="Area / Street">
                    <input
                      value={area}
                      onChange={(event) => setArea(event.target.value)}
                      className="form-input w-full"
                      placeholder="Bypass Road, Narasaraopet"
                      required
                    />
                  </Field>
                  <Field label="City">
                    <input value={city} readOnly className="form-input w-full cursor-not-allowed text-white/70" />
                  </Field>
                </div>

                <div className="space-y-3 border-t border-white/10 bg-captain-black/40 p-5">
                  <Button type="submit" disabled={submitting} className="w-full">
                    {submitting ? <Spinner /> : "Confirm & Place Order"}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setStep("cart")} className="w-full">
                    Back to Cart
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center space-y-6 p-8 text-center">
                <div className="grid h-16 w-16 place-items-center rounded-full border border-emerald-400 bg-emerald-500/10 text-emerald-400">
                  <ShoppingBag size={28} />
                </div>
                <div className="space-y-2">
                  <h3 className="font-bebas text-3xl tracking-wider text-white">ORDER CONFIRMED</h3>
                  <p className="text-sm text-white/60">Your order is saved and waiting for assignment.</p>
                </div>
                <div className="w-full rounded-lg border border-captain-gold/25 bg-captain-gold/5 p-4 font-mono text-center">
                  <span className="block text-xs text-white/50">ORDER ID</span>
                  <span className="text-xl font-bold text-captain-bright">#{orderId}</span>
                </div>
                <a
                  href={googleMapsSearchUrl(orderAddress)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-captain-gold bg-captain-gold px-5 py-3 font-nav text-sm font-extrabold uppercase tracking-[0.14em] text-captain-black"
                >
                  <ExternalLink size={17} /> Open Address in Maps
                </a>
                <Button onClick={closeDrawer} className="w-full">
                  Continue Shopping
                </Button>
              </div>
            )}
          </motion.aside>
        ) : null}
      </AnimatePresence>
      <Toast message={toast} tone="green" />
    </>
  );
}

function Field({ label, children }) {
  return (
    <label className="grid gap-2">
      <span className="font-nav text-xs font-extrabold uppercase tracking-[0.14em] text-white/60">{label}</span>
      {children}
    </label>
  );
}

function Row({ label, value, strong }) {
  return (
    <div className={`flex justify-between ${strong ? "pt-2 font-mono text-lg font-extrabold text-captain-bright" : ""}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
