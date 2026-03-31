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
  const [shippingQuote, setShippingQuote] = useState(null);

  async function refreshCart() {
    if (!user) {
      setCart(emptyCart);
      setShippingQuote(null);
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
    });
  }, [user, isHydrating]);

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

  async function completeCheckout(payload) {
    const response = await createOrder(payload);
    setShippingQuote(null);
    setCart(mergeCartWithShipping(response.cart));
    return response;
  }

  return (
    <CartContext.Provider
      value={{
        addItem,
        cart,
        changeItem,
        clearShippingQuote,
        completeCheckout,
        isCartLoading,
        quoteShipping,
        refreshCart,
        removeItem,
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
