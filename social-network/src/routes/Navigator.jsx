"use client";
import { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import RedirectIfAuthed from "./RedirectIfAuthed";
import RequireAuth from "./RequireAuth";
import Login from "@/views/Login";
import Register from "@/views/Register";
import { AuthProvider } from "@/context/AuthContext";
import Feed from "@/views/Feed";
import AppLayout from "@/components/AppLayout";
import Account from "@/views/Account";
import Inbox from "@/views/Inbox";
import CreateGroup from "@/views/CreateGroup";
import CreatePost from "@/views/CreatePost";
import PostPage from "@/views/PostPage";
import EditPost from "@/views/EditPost";

function Navigator() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<RedirectIfAuthed />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          <Route element={<RequireAuth />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Feed />} />
              <Route path="/inbox" element={<Inbox />} />
              <Route path="/account" element={<Account />} />
              <Route path="/create-group" element={<CreateGroup />} />
              <Route path="/create-post" element={<CreatePost />} />
              <Route
                path="/r/:group/comments/:postId/:slug?"
                element={<PostPage />}
              />
              <Route path="/edit-post/:postId" element={<EditPost />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default Navigator;
