"use client";

import { useAuth } from "@/context/AuthContext";
import { Navigate, Outlet } from "react-router-dom";

function RedirectIfAuthed() {
  const { user, loading } = useAuth();

  // waiting for setup to end.
  if (loading) {
    return null;
  }

  // user is logged in
  if (user) {
    return <Navigate to="/" replace />;
  }

  // render login or sign up since user is not logged in
  return <Outlet />;
}

export default RedirectIfAuthed;
