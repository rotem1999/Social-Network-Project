"use client";

import { useAuth } from "@/context/AuthContext";
import { Navigate, Outlet, useLocation } from "react-router-dom";

function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();

  // waiting for setup to end.
  if (loading) {
    return null;
  }

  // user is not logged in, redirect to login page
  if (!user) {
    // navigate to login and send the current location to redirect back after loggin in
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // user is logged in, render page routes
  return <Outlet />;
}

export default RequireAuth;
