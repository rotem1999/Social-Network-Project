"use client";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import PasswordInput from "@/components/PasswordInput";
import axios from "axios";

const USERS_URL =
  (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000") + "/api/users";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password) {
      setError("Username and password are required");
      return;
    }

    setSubmitting(true);
    try {
      const res = await axios.post(USERS_URL, {
        command: "login",
        data: { username: username.trim(), password: password.trim() },
      });

      login(res.data.token, res.data.user);

      // return to previous page or navigate to feed page
      const redirectTo = location.state?.from?.pathname || "/";
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Login failed please try again");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-2xl border p-6"
      >
        <h1 className="text-2xl font-bold">Login</h1>
        {error && (
          <div className="rounded border border-red-300 bg-red-50 p-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <input
          className="w-full rounded border p-2"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <PasswordInput
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-blue-500 p-2 text-white transition disabled:opacity-50"
        >
          {submitting ? "logging in" : "Log in"}
        </button>

        <p className="text-center text-sm">
          No Account?{" "}
          <Link to="/register" className="text-blue-600 undeline">
            Register
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Login;
