export function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function getBackendUrl() {
  return import.meta.env.VITE_BACKEND_URL || "";
}

function hasLiveClientKey() {
  const key = import.meta.env.VITE_RAZORPAY_KEY_ID;
  return Boolean(key && !key.includes("REPLACE"));
}

export async function openRazorpayCheckout({ amount, name, description, prefill, onSuccess, onFailure }) {
  const loaded = await loadRazorpayScript();
  if (!loaded || !window.Razorpay || !hasLiveClientKey()) {
    onSuccess?.({
      razorpay_payment_id: `demo_${Date.now()}`,
      razorpay_order_id: `order_demo_${Date.now()}`,
      razorpay_signature: "demo-signature"
    });
    return;
  }

  const token = await prefill?.getToken?.();
  const response = await fetch(`${getBackendUrl()}/api/payments/create-order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({
      amount,
      receipt: `c7_${Date.now()}`,
      notes: { description }
    })
  });
  const order = await response.json();

  const razorpay = new window.Razorpay({
    key: import.meta.env.VITE_RAZORPAY_KEY_ID,
    amount: order.amount,
    currency: "INR",
    name,
    description,
    order_id: order.id,
    prefill,
    theme: { color: "#D4AF37" },
    handler: async (payload) => {
      const verifyResponse = await fetch(`${getBackendUrl()}/api/payments/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });
      const result = await verifyResponse.json();
      if (result.verified) await onSuccess?.(payload);
      else onFailure?.();
    },
    modal: { ondismiss: onFailure }
  });
  razorpay.open();
}
