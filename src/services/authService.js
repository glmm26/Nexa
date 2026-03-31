import { apiRequest } from "./apiClient";

export function fetchSession() {
  return apiRequest("/api/auth/me");
}

export function login(payload) {
  return apiRequest("/api/auth/login", {
    method: "POST",
    body: payload,
  });
}

export function logout() {
  return apiRequest("/api/auth/logout", {
    method: "POST",
  });
}

export function register(payload) {
  return apiRequest("/api/auth/register", {
    method: "POST",
    body: payload,
  });
}

export function verifyOtp(payload) {
  return apiRequest("/api/auth/verify-otp", {
    method: "POST",
    body: payload,
  });
}

export function resendOtp(payload) {
  return apiRequest("/api/auth/resend-otp", {
    method: "POST",
    body: payload,
  });
}
