import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { LoadingBlock } from "./LoadingBlock";

export function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, isHydrating, user } = useAuth();
  const location = useLocation();

  if (isHydrating) {
    return <LoadingBlock label="Preparando sua conta..." />;
  }

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location.pathname }} to="/login" />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate replace to="/" />;
  }

  if (requiredRole === "admin" && !user?.adminAuthorized) {
    return <Navigate replace to="/login" />;
  }

  return children;
}
