import { createContext, useEffect, useMemo, useState } from "react";
import { calculateDiscount } from "../hooks/useCoupon.js";

export const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("captain7:cart") || "[]");
    } catch {
      return [];
    }
  });
  const [couponCode, setCouponCode] = useState("");
  const [couponResult, setCouponResult] = useState(null);
  const [open, setOpen] = useState(false);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = couponResult?.valid ? couponResult.discount : 0;
  const gst = Math.round((subtotal - discount) * 0.05);
  const total = Math.max(0, subtotal - discount + gst);

  useEffect(() => {
    localStorage.setItem("captain7:cart", JSON.stringify(items));
  }, [items]);

  const value = useMemo(
    () => ({
      items,
      open,
      setOpen,
      couponCode,
      setCouponCode,
      couponResult,
      subtotal,
      discount,
      gst,
      total,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      addItem(product) {
        setItems((current) => {
          const existing = current.find((item) => item.id === product.id);
          if (existing) {
            return current.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
          }
          return [...current, { ...product, quantity: 1 }];
        });
        setOpen(true);
      },
      addCombo(combo) {
        setItems((current) => {
          const product = { ...combo, category: "Combo Offers", isVeg: true };
          const existing = current.find((item) => item.id === product.id);
          if (existing) {
            return current.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
          }
          return [...current, { ...product, quantity: 1 }];
        });
        setOpen(true);
      },
      updateQuantity(id, quantity) {
        setItems((current) =>
          quantity <= 0
            ? current.filter((item) => item.id !== id)
            : current.map((item) => (item.id === id ? { ...item, quantity } : item))
        );
      },
      removeItem(id) {
        setItems((current) => current.filter((item) => item.id !== id));
      },
      applyCoupon(code = couponCode) {
        const result = calculateDiscount(code, subtotal, "food");
        setCouponCode(code);
        setCouponResult(result);
        return result;
      },
      clearCart() {
        setItems([]);
        setCouponCode("");
        setCouponResult(null);
      }
    }),
    [items, open, couponCode, couponResult, subtotal, discount, gst, total]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
