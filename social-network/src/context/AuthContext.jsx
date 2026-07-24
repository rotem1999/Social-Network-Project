"use client";
import { createContext, useContext, useEffect, useState, useMemo } from "react";
import axios from "axios";
import { USERS_URL } from "@/lib/Api";
import { signInWithCustomToken, signOut } from "firebase/auth";
import { auth } from "@/lib/Firebase";

const TOKEN_KEY = "token";
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) {
      setLoading(false);
      return;
    }

    // fetching user token from backend
    axios
      .post(
        USERS_URL,
        { command: "select" },
        {
          headers: { Authorization: "Bearer " + stored },
        },
      )
      .then((res) => {
        //  token is valid
        axios.defaults.headers.common.Authorization = "Bearer " + stored;
        setToken(stored);
        const u = res.data.user;
        setUser({ ...u, id: u._id || u.id });
      })
      .catch(() => {
        // token is not valid -> got 401 / expired / invalid token
        localStorage.removeItem(TOKEN_KEY);
        delete axios.defaults.headers.common.Authorization;
        setToken(null);
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  async function login(newToken, newUser, firebaseToken) {
    localStorage.setItem(TOKEN_KEY, newToken);
    axios.defaults.headers.common.Authorization = "Bearer " + newToken;
    setToken(newToken);
    setUser(newUser);
    if (firebaseToken) {
      try {
        await signInWithCustomToken(auth, firebaseToken);
      } catch (e) {
        console.error("firebase sign-in failed", e);
      }
    }
  }

  async function logout() {
    localStorage.removeItem(TOKEN_KEY);
    delete axios.defaults.headers.common.Authorization;
    setToken(null);
    setUser(null);

    try {
      await signOut(auth);
    } catch (e) {
      console.error("firebase sign-out failed", e);
    }
  }

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      logout,
    }),
    [user, token, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
