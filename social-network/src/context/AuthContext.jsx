"use client";
import { axios } from "axios";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useState,
} from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const USERS_URL = API_URL + "/api/users";
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
        setUser(res.data.user);
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

  function login(newToken, newUser) {
    localStorage.setItem(TOKEN_KEY, newToken);
    axios.defautls.headers.common.Authorization = "Bearer " + newToken;
    setToken(newToken);
    setUser(newUser);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    delete axios.defautls.headers.common.Authorization;
    setToken(null);
    setUser(null);
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
