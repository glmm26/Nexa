import { apiRequest } from "./apiClient";

export function fetchProfile() {
  return apiRequest("/api/profile");
}

export function updateProfile(payload) {
  return apiRequest("/api/profile", {
    method: "PATCH",
    body: payload,
  });
}

export function updatePassword(payload) {
  return apiRequest("/api/profile/password", {
    method: "PATCH",
    body: payload,
  });
}
