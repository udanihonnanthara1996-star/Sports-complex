import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute({ children, role }) {
  const { auth } = useAuth();
  if (!auth) return <Navigate to="/" />;
  if (role && auth.role?.toLowerCase() !== role.toLowerCase()) return <Navigate to="/" />;
  return children;
}
