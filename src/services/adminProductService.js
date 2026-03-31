import { apiRequest } from "./apiClient";

export function fetchAdminProducts() {
  return apiRequest("/api/admin/products");
}

export function createAdminProduct(payload) {
  return apiRequest("/api/admin/products", {
    method: "POST",
    body: payload,
  });
}

export function updateAdminProduct(productId, payload) {
  return apiRequest(`/api/admin/products/${productId}`, {
    method: "PUT",
    body: payload,
  });
}

export function deleteAdminProduct(productId) {
  return apiRequest(`/api/admin/products/${productId}`, {
    method: "DELETE",
  });
}

export function updateAdminProductStock(productId, payload) {
  return apiRequest(`/api/admin/products/${productId}/stock`, {
    method: "PATCH",
    body: payload,
  });
}
