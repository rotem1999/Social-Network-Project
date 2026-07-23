"use client";
import { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import RedirectIfAuthed from "./RedirectIfAuthed";
import RequireAuth from "./RequireAuth";
import Login from "@/views/Login";

function Navigator() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<RedirectIfAuthed />}>
          <Route path="/login" element={<Login />} />
          {/* <route path="/register" element={<Register />} /> */}
        </Route>

        <Route element={<RequireAuth />}>
          {/* <Route path="/" element={<Front />} /> */}
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default Navigator;
