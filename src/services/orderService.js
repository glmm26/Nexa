import { apiRequest } from "./apiClient";

export function createOrder(payload) {
  return apiRequest("/api/orders", {
    method: "POST",
    body: payload,
  });
}

export function fetchMyOrders() {
  return apiRequest("/api/orders");
}

export function fetchOrderDetails(orderId) {
  return apiRequest(`/api/orders/${orderId}`);
}

export function fetchAdminOrders() {
  return apiRequest("/api/admin/orders");
}

export function updateAdminOrderStatus(orderId, payload) {
  return apiRequest(`/api/admin/orders/${orderId}/status`, {
    method: "PUT",
    body: payload,
  });
}
