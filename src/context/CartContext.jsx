import { createContext, useContext, useEffect, useState } from "react";
import {
  addCartItem,
  fetchCart,
  fetchShippingQuote,
  removeCartItem,
  updateCartItem,
} from "../services/cartService";
import { createOrder } from "../services/orderService";
import { useAuthContext } from "./AuthContext";

const SHIPPING_QUOTE_STORAGE_KEY = "nexa_shipping_quote";
const CHECKOUT_DRAFT_STORAGE_KEY = "nexa_checkout_draft";
const LAST_ORDER_STORAGE_KEY = "nexa_last_completed_order";

const emptyCart = {
  items: [],
  summary: {
    itemCount: 0,
    subtotal: 0,
    shipping: 0,
    total: 0,
    freeShippingThreshold: 350,
    shippingCalculated: false,
  },
};

const CartContext = createContext(null);

function createEmptyCheckoutDraft() {
  return {
    address: "",
    city: "",
    email: "",
    name: "",
    notes: "",
    zipCode: "",
  };
}

function readStoredValue(storageKey, fallbackValue) {
  if (typeof window === "undefined") {
    return fallbackValue;
  }

  try {
    const rawValue = window.localStorage.getItem(storageKey);
    return rawValue ? JSON.parse(rawValue) : fallbackValue;
  } catch (error) {
    return fallbackValue;
  }
}

function writeStoredValue(storageKey, value) {
  if (typeof window === "undefined") {
    return;
  }

  if (value === null) {
    window.localStorage.removeItem(storageKey);
    return;
  }

  window.localStorage.setItem(storageKey, JSON.stringify(value));
}

function mergeCartWithShipping(cart, shippingQuote = null) {
  const items = Array.isArray(cart?.items) ? cart.items : [];
  const baseSummary = cart?.summary || emptyCart.summary;
  const shipping = shippingQuote ? Number(shippingQuote.amount) : 0;
  const subtotal = Number(baseSummary.subtotal) || 0;

  return {
    items,
    summary: {
      ...baseSummary,
      shipping,
      total: Math.round((subtotal + shipping) * 100) / 100,
      shippingCalculated: Boolean(shippingQuote),
    },
  };
}

export function CartProvider({ children }) {
  const { user, isHydrating } = useAuthContext();
  const [cart, setCart] = useState(emptyCart);
  const [isCartLoading, setIsCartLoading] = useState(false);
  const [shippingQuote, setShippingQuote] = useState(() =>
    readStoredValue(SHIPPING_QUOTE_STORAGE_KEY, null)
  );
  const [checkoutDraft, setCheckoutDraft] = useState(() =>
    readStoredValue(CHECKOUT_DRAFT_STORAGE_KEY, createEmptyCheckoutDraft())
  );
  const [lastCompletedOrder, setLastCompletedOrder] = useState(() =>
    readStoredValue(LAST_ORDER_STORAGE_KEY, null)
  );

  async function refreshCart() {
    if (!user) {
      setCart(emptyCart);
      setShippingQuote(null);
      setCheckoutDraft(createEmptyCheckoutDraft());
      setLastCompletedOrder(null);
      return emptyCart;
    }

    setIsCartLoading(true);

    try {
      const response = await fetchCart();
      const nextCart = mergeCartWithShipping(response, shippingQuote);
      setCart(nextCart);
      return nextCart;
    } finally {
      setIsCartLoading(false);
    }
  }

  useEffect(() => {
    if (isHydrating) {
      return;
    }

    refreshCart().catch(() => {
      setCart(emptyCart);
      setShippingQuote(null);
      setCheckoutDraft(createEmptyCheckoutDraft());
      setLastCompletedOrder(null);
    });
  }, [user, isHydrating]);

  useEffect(() => {
    writeStoredValue(SHIPPING_QUOTE_STORAGE_KEY, shippingQuote);
  }, [shippingQuote]);

  useEffect(() => {
    writeStoredValue(CHECKOUT_DRAFT_STORAGE_KEY, checkoutDraft);
  }, [checkoutDraft]);

  useEffect(() => {
    writeStoredValue(LAST_ORDER_STORAGE_KEY, lastCompletedOrder);
  }, [lastCompletedOrder]);

  async function addItem(payload) {
    const response = await addCartItem(payload);
    const nextShippingQuote = response.items.length ? shippingQuote : null;
    setShippingQuote(nextShippingQuote);
    setCart(mergeCartWithShipping(response, nextShippingQuote));
    return response;
  }

  async function changeItem(itemId, payload) {
    const response = await updateCartItem(itemId, payload);
    const nextShippingQuote = response.items.length ? shippingQuote : null;
    setShippingQuote(nextShippingQuote);
    setCart(mergeCartWithShipping(response, nextShippingQuote));
    return response;
  }

  async function removeItem(itemId) {
    const response = await removeCartItem(itemId);
    const nextShippingQuote = response.items.length ? shippingQuote : null;
    setShippingQuote(nextShippingQuote);
    setCart(mergeCartWithShipping(response, nextShippingQuote));
    return response;
  }

  async function quoteShipping(zipCode) {
    const response = await fetchShippingQuote({ zipCode });
    setShippingQuote(response.shippingQuote);
    setCart(mergeCartWithShipping(response.cart, response.shippingQuote));
    return response;
  }

  function clearShippingQuote() {
    setShippingQuote(null);
    setCart((current) => mergeCartWithShipping(current, null));
  }

  function saveCheckoutDraft(payload) {
    setCheckoutDraft((current) => ({
      ...current,
      ...payload,
    }));
  }

  function clearCheckoutDraft() {
    setCheckoutDraft(createEmptyCheckoutDraft());
  }

  function clearLastCompletedOrder() {
    setLastCompletedOrder(null);
  }

  async function completeCheckout(payload, paymentDetails = null) {
    const response = await createOrder(payload);
    setShippingQuote(null);
    setCheckoutDraft(createEmptyCheckoutDraft());
    setCart(mergeCartWithShipping(response.cart));
    setLastCompletedOrder({
      order: response.order,
      payment: paymentDetails,
      createdAt: new Date().toISOString(),
    });
    return response;
  }

  return (
    <CartContext.Provider
      value={{
        addItem,
        cart,
        changeItem,
        checkoutDraft,
        clearCheckoutDraft,
        clearLastCompletedOrder,
        clearShippingQuote,
        completeCheckout,
        isCartLoading,
        lastCompletedOrder,
        quoteShipping,
        refreshCart,
        removeItem,
        saveCheckoutDraft,
        shippingQuote,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCartContext() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCartContext precisa ser usado dentro de CartProvider.");
  }

  return context;
}
