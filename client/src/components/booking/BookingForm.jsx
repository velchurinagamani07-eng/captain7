import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useSettingDoc } from "../../hooks/useSettings.js";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useNavigate } from "react-router-dom";
import { openRazorpayCheckout } from "../../utils/razorpay.js";
import { formatCurrency } from "../../utils/formatCurrency.js";
import { calculateDiscount } from "../../hooks/useCoupon.js";
import { Button } from "../ui/Button.jsx";
import { Badge } from "../ui/Badge.jsx";
import { Spinner } from "../ui/Spinner.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import { createBookingWithTransaction } from "../../utils/bookingTransaction.js";
import { openOwnerWhatsApp } from "../../utils/whatsapp.js";
import { hasFirebaseConfig } from "../../firebase/config.js";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase.js";

const schema = yup.object({
  name: yup.string().required("Name is required"),
  phone: yup.string().min(10, "Enter a valid phone").required("Phone is required"),
  players: yup.number().min(2).max(12).required(),
  teamName: yup.string()
});

const addOns = [
  { id: "bat", label: "Bat rental", price: 50 },
  { id: "helmet", label: "Helmet", price: 30 },
  { id: "gloves", label: "Batting gloves", price: 20 }
];

export function BookingForm({ selectedDate, selectedSlot, onConfirmed }) {
  const { user, getToken } = useAuth();
  const navigate = useNavigate();
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [couponCode, setCouponCode] = useState("");
  const [couponResult, setCouponResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Location States
  const [locationMode, setLocationMode] = useState("manual");
  const [address, setAddress] = useState("");
  const [coordinates, setCoordinates] = useState(null);
  const [detectingLocation, setDetectingLocation] = useState(false);

  const { data: apiKeys } = useSettingDoc("apiKeys", {});
  const googleMapsApiKey = apiKeys?.googleMapsApiKey || "";
  const { data: paymentLinks } = useSettingDoc("paymentLinks", {});

  const handleAutoDetect = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCoordinates({ lat, lng });
        
        try {
          let detectedAddress = "";
          if (googleMapsApiKey) {
            const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googleMapsApiKey}`);
            const data = await res.json();
            if (data.results && data.results[0]) {
              detectedAddress = data.results[0].formatted_address;
            }
          }
          if (!detectedAddress) {
            // Fallback to free Nominatim API
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
              headers: {
                "User-Agent": "Captain7App/1.0"
              }
            });
            const data = await res.json();
            detectedAddress = data.display_name || `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`;
          }
          setAddress(detectedAddress);
        } catch (err) {
          console.warn("Reverse geocoding error:", err);
          setAddress(`Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`);
        } finally {
          setDetectingLocation(false);
        }
      },
      (error) => {
        console.error(error);
        alert("Unable to retrieve location. Please input address manually.");
        setDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { players: 6 }
  });

  const addOnTotal = useMemo(
    () => selectedAddOns.reduce((sum, id) => sum + (addOns.find((item) => item.id === id)?.price || 0), 0),
    [selectedAddOns]
  );
  const subtotal = (selectedSlot?.price || 0) + addOnTotal;
  const discount = couponResult?.valid ? couponResult.discount : 0;
  const total = Math.max(0, subtotal - discount);

  const toggleAddOn = (id) => {
    setSelectedAddOns((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const applyCoupon = () => {
    setCouponResult(calculateDiscount(couponCode, subtotal, "cricket"));
  };

  const submit = async (values) => {
    if (!selectedSlot) return;
    if (!address.trim()) {
      alert("Please enter or auto-detect your location address");
      return;
    }
    if (hasFirebaseConfig && !user) {
      navigate("/login?redirect=/cricket-booking");
      return;
    }
    setSubmitting(true);
    try {
      if (paymentLinks?.cricketBookingUrl) {
        const bookingId = `C7-M${Date.now().toString().slice(-5)}`;
        const bookingPayload = {
          id: bookingId,
          slotId: selectedSlot.id,
          date: selectedDate,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          userId: user?.uid || "guest",
          userName: values.name,
          userPhone: values.phone,
          userEmail: user?.email || "",
          status: "pending",
          paymentStatus: "pending",
          amount: total,
          addOns: selectedAddOns,
          address,
          coordinates,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        await setDoc(doc(db, "bookings", bookingId), bookingPayload);

        window.open(paymentLinks.cricketBookingUrl, "_blank");

        openOwnerWhatsApp(
          `New Captain 7 booking requested (Payment Pending). Name: ${values.name}. Date: ${selectedDate}. Slot: ${selectedSlot.startTime}-${selectedSlot.endTime}. Amount: ${formatCurrency(total)}. Booking ID: ${bookingId}.`
        );

        onConfirmed?.({ id: bookingId, status: "pending" });
        return;
      }

      await openRazorpayCheckout({
        amount: total,
        name: "Captain 7 Eat & Play",
        description: "Cricket slot booking",
        prefill: { name: values.name, contact: values.phone, getToken },
        onSuccess: async (payment) => {
          const bookingId = `C7-${Date.now().toString().slice(-6)}`;
          const bookingPayload = {
            id: bookingId,
            slotId: selectedSlot.id,
            date: selectedDate,
            startTime: selectedSlot.startTime,
            endTime: selectedSlot.endTime,
            userId: user?.uid || "guest",
            userName: values.name,
            userPhone: values.phone,
            userEmail: user?.email || "",
            status: "confirmed",
            paymentId: payment.razorpay_payment_id,
            paymentOrderId: payment.razorpay_order_id,
            razorpaySignature: payment.razorpay_signature,
            amount: total,
            addOns: selectedAddOns,
            address,
            coordinates
          };
          const result = await createBookingWithTransaction(bookingPayload);
          openOwnerWhatsApp(
            `New Captain 7 booking confirmed. Name: ${values.name}. Date: ${selectedDate}. Slot: ${selectedSlot.startTime}-${selectedSlot.endTime}. Amount: ${formatCurrency(total)}. Booking ID: ${result.id}.`
          );
          onConfirmed({
            id: result.id,
            date: selectedDate,
            slot: selectedSlot,
            amount: total,
            values,
            addOns: selectedAddOns
          });
        },
        onFailure: () => {}
      });
    } catch (error) {
      if (error.message === "SLOT_TAKEN") {
        alert("Slot just booked by someone else. Please choose another slot.");
      } else {
        alert("Payment or booking could not be completed. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="rounded-lg border border-captain-gold/25 bg-captain-card p-5 shadow-gold">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-serif text-2xl font-bold text-white">Player Details</h3>
          <p className="text-sm text-white/52">Pending reservation holds for 10 minutes in Firebase mode.</p>
        </div>
        <Badge tone={selectedSlot ? "green" : "grey"}>{selectedSlot ? "Ready" : "Pick Slot"}</Badge>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Name" error={errors.name?.message}>
          <input {...register("name")} className="form-input" placeholder="Player name" />
        </Field>
        <Field label="Phone" error={errors.phone?.message}>
          <input {...register("phone")} className="form-input" placeholder="90004 69552" />
        </Field>
        <Field label="Players" error={errors.players?.message}>
          <input {...register("players")} type="number" min="2" max="12" className="form-input" />
        </Field>
        <Field label="Team Name">
          <input {...register("teamName")} className="form-input" placeholder="Optional" />
        </Field>
      </div>

      <div className="mt-4 border-t border-white/5 pt-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-nav text-xs font-extrabold uppercase tracking-[0.14em] text-white/60">Location / Address *</span>
          <button
            type="button"
            onClick={() => {
              const newMode = locationMode === "manual" ? "auto" : "manual";
              setLocationMode(newMode);
              if (newMode === "auto") {
                handleAutoDetect();
              }
            }}
            className="rounded border border-captain-gold/45 bg-captain-gold/10 px-3 py-1 text-xs font-semibold text-captain-bright hover:bg-captain-gold/20"
          >
            Switch to {locationMode === "manual" ? "Auto Detect" : "Manual Entry"}
          </button>
        </div>
        
        {locationMode === "manual" ? (
          <label className="grid gap-2">
            <span className="sr-only">Address</span>
            <input
              type="text"
              className="form-input"
              placeholder="Type your address manually"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </label>
        ) : (
          <div className="rounded-lg border border-white/10 bg-captain-black/40 p-4">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="font-semibold text-white">Auto-detected Address:</span>
              {detectingLocation ? (
                <span className="flex items-center gap-1 text-captain-gold animate-pulse text-[10px]">
                  Detecting...
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleAutoDetect}
                  className="text-captain-bright hover:underline"
                >
                  Redetect
                </button>
              )}
            </div>
            <p className="mt-2 text-sm text-white/80 leading-relaxed font-sans min-h-8">
              {address || "No location detected yet. Click 'Redetect' if needed."}
            </p>
            {coordinates && (
              <div className="mt-1 font-mono text-[10px] text-white/45">
                Coords: {coordinates.lat.toFixed(5)}, {coordinates.lng.toFixed(5)}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="mt-5">
        <div className="mb-3 font-nav text-xs font-extrabold uppercase tracking-[0.14em] text-white/60">Add-ons</div>
        <div className="grid gap-3 md:grid-cols-3">
          {addOns.map((item) => (
            <label
              key={item.id}
              className={`flex cursor-pointer items-center justify-between rounded-lg border p-4 ${
                selectedAddOns.includes(item.id) ? "border-captain-gold bg-captain-gold/10" : "border-white/10 bg-captain-black"
              }`}
            >
              <span className="text-sm text-white/78">{item.label}</span>
              <span className="font-mono text-sm text-captain-bright">+{formatCurrency(item.price)}</span>
              <input
                type="checkbox"
                checked={selectedAddOns.includes(item.id)}
                onChange={() => toggleAddOn(item.id)}
                className="sr-only"
              />
            </label>
          ))}
        </div>
      </div>
      <div className="mt-5 flex gap-2">
        <input
          value={couponCode}
          onChange={(event) => setCouponCode(event.target.value)}
          className="form-input min-w-0 flex-1"
          placeholder="Coupon code"
        />
        <button
          type="button"
          onClick={applyCoupon}
          className="rounded-full border border-captain-gold px-4 py-3 font-nav text-xs font-extrabold uppercase tracking-[0.12em] text-captain-gold"
        >
          Apply
        </button>
      </div>
      {couponResult ? (
        <p className={`mt-2 text-sm ${couponResult.valid ? "text-emerald-200" : "text-red-200"}`}>{couponResult.message}</p>
      ) : null}
      <div className="mt-6 rounded-lg border border-captain-gold/25 bg-captain-black p-5">
        <Row label="Slot" value={selectedSlot ? `${selectedSlot.startTime} - ${selectedSlot.endTime}` : "Not selected"} />
        <Row label="Subtotal" value={formatCurrency(subtotal)} />
        <Row label="Discount" value={`- ${formatCurrency(discount)}`} />
        <Row label="Payable" value={formatCurrency(total)} strong />
      </div>
      <Button disabled={!selectedSlot || submitting} type="submit" className="mt-5 w-full">
        {submitting ? <Spinner /> : "Pay With Razorpay"}
      </Button>
    </form>
  );
}

function Field({ label, error, children }) {
  return (
    <label className="grid gap-2">
      <span className="font-nav text-xs font-extrabold uppercase tracking-[0.14em] text-white/60">{label}</span>
      {children}
      {error ? <span className="text-xs text-red-200">{error}</span> : null}
    </label>
  );
}

function Row({ label, value, strong }) {
  return (
    <div className={`flex justify-between py-1 ${strong ? "font-mono text-xl font-extrabold text-captain-bright" : "text-sm text-white/62"}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
