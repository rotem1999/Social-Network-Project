"use client";

import { useAuth } from "@/context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import PasswordInput from "@/components/PasswordInput";

const USERS_URL =
  (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000") + "/api/users";

const EMPTY = {
  firstName: "",
  lastName: "",
  email: "",
  username: "",
  password: "",
  confirm: "",
};

const Register = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const validate = () => {
    if (
      !form.firstName.trim() ||
      !form.lastName.trim() ||
      !form.email.trim() ||
      !form.username.trim() ||
      !form.password
    ) {
      return "All fields are required";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      return "Please enter a valid email address";
    }
    if (form.password.length < 6) {
      return "Password length must be at least 6 characters";
    }
    if (form.password !== form.confirm) {
      return "Passwords do not match";
    }
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setError("");

    setSubmitting(true);
    try {
      await axios.post(USERS_URL, {
        command: "insert",
        data: {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          username: form.username.trim(),
          password: form.password,
        },
      });

      const res = await axios.post(USERS_URL, {
        command: "login",
        data: { username: form.username, password: form.password },
      });

      login(res.data.token, res.data.user);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-2xl border p-8"
      >
        <h1 className="text-2xl font-bold">Create Account</h1>

        {error && (
          <div className="rounded border border-red-300 bg-red-50 p-2 text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <input
            className="rounded border p-2"
            placeholder="First Name"
            value={form.firstName}
            onChange={update("firstName")}
          />
          <input
            className="rounded border p-2"
            placeholder="Last Name"
            value={form.lastName}
            onChange={update("lastName")}
          />
        </div>
        <input
          className="w-full rounded border p-2"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={update("email")}
        />
        <input
          className="w-full rounded border p-2"
          placeholder="username"
          value={form.username}
          onChange={update("username")}
        />
        {/* <input
          className="w-full rounded border p-2"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={update("password")}
        /> */}
        <PasswordInput value={form.password} onChange={update("password")} />
        <PasswordInput
          placeholder="Confirm Password"
          value={form.confirm}
          onChange={update("confirm")}
        />

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-blue-500 p-2 text-white transition disabled:opacity-50"
        >
          {submitting ? "Creating..." : "Register"}
        </button>

        <p className="text-center text-sm">
          Have an account?{" "}
          <Link to="/login" className="text-blue-600 underline">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Register;
