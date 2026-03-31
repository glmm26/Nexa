import { createContext, useContext, useEffect, useState } from "react";
import {
  fetchSession,
  login as loginRequest,
  logout as logoutRequest,
} from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isHydrating, setIsHydrating] = useState(true);

  async function refreshSession() {
    const response = await fetchSession();
    setUser(response.authenticated ? response.user : null);
    return response.authenticated ? response.user : null;
  }

  useEffect(() => {
    refreshSession()
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setIsHydrating(false);
      });
  }, []);

  async function login(payload) {
    const response = await loginRequest(payload);
    setUser(response.user);
    return response;
  }

  async function logout() {
    await logoutRequest();
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: Boolean(user),
        isHydrating,
        login,
        logout,
        refreshSession,
        setUser,
        user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuthContext precisa ser usado dentro de AuthProvider.");
  }

  return context;
}
