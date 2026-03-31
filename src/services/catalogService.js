import { apiRequest } from "./apiClient";

export function fetchCatalog() {
  return apiRequest("/api/products");
}

export function fetchProduct(productId) {
  return apiRequest(`/api/products/${productId}`);
}
