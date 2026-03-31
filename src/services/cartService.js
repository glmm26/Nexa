import { apiRequest } from "./apiClient";

export function fetchCart() {
  return apiRequest("/api/cart");
}

export function addCartItem(payload) {
  return apiRequest("/api/cart/items", {
    method: "POST",
    body: payload,
  });
}

export function fetchShippingQuote(payload) {
  return apiRequest("/api/cart/shipping-quote", {
    method: "POST",
    body: payload,
  });
}

export function updateCartItem(itemId, payload) {
  return apiRequest(`/api/cart/items/${itemId}`, {
    method: "PATCH",
    body: payload,
  });
}

export function removeCartItem(itemId) {
  return apiRequest(`/api/cart/items/${itemId}`, {
    method: "DELETE",
  });
}
