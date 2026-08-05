"use client";
import { useState } from "react";
import axios from "axios";
import { USERS_URL } from "@/lib/Api";
import { useAuth } from "@/context/AuthContext";

const AccountEditor = () => {
  const { user, setUser } = useAuth();

  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  const emailChanged =
    email.trim().toLowerCase() !== (user?.email || "").toLowerCase();
  const needsCurrent = emailChanged || password.length > 0;

  const openEditor = () => {
    setFirstName(user?.firstName || "");
    setLastName(user?.lastName || "");
    setEmail(user?.email || "");
    setPassword("");
    setConfirm("");
    setCurrentPassword("");
    setError("");
    setDone("");
    setEditing(true);
  };

  const closeEditor = () => {
    setPassword("");
    setConfirm("");
    setCurrentPassword("");
    setError("");
    setEditing(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setDone("");

    if (!firstName.trim() || firstName.trim().length > 40) {
      return setError("First name must be 1-40 characters");
    }
    if (!lastName.trim() || lastName.trim().length > 40) {
      return setError("Last name must be 1-40 characters");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return setError("Please enter a valid email address");
    }
    if (password && password.length < 6) {
      return setError("New password must be at least 6 characters");
    }
    if (password && password !== confirm) {
      return setError("New password and confirmation do not match");
    }
    if (needsCurrent && !currentPassword) {
      return setError(
        "Enter your current password to change your email or password",
      );
    }

    const payload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
    };
    if (password) payload.password = password;
    if (needsCurrent) payload.currentPassword = currentPassword;

    setBusy(true);
    try {
      const res = await axios.post(USERS_URL, {
        command: "update",
        data: payload,
      });
      const updated = res.data.user || {};
      setUser((current) => ({
        ...current,
        ...updated,
        id: updated._id || current?.id,
      }));
      setPassword("");
      setConfirm("");
      setCurrentPassword("");
      setEditing(false);
      setDone("Account updated");
    } catch (err) {
      setError(err.response?.data?.message || "Update failed");
    } finally {
      setBusy(false);
    }
  };

  const field =
    "w-full rounded border px-3 py-1.5 text-sm transition focus:border-orange-500 focus:outline-none";

  return (
    <div className="rounded-2xl border p-4 text-sm">
      <div className="flex items-center justify-between pb-2">
        <h2 className="font-semibold">Account details</h2>
        {!editing && (
          <button
            onClick={openEditor}
            className="rounded-full border px-3 py-1 text-xs transition hover:bg-gray-100 hover:cursor-pointer"
          >
            Edit
          </button>
        )}
      </div>

      {!editing ? (
        <>
          <dl>
            <div className="flex justify-between py-1">
              <dt className="text-gray-500">Name:</dt>
              <dd>
                {user?.firstName} {user?.lastName}
              </dd>
            </div>
            <div className="flex justify-between py-1">
              <dt className="text-gray-500">Username</dt>
              <dd>{user?.username}</dd>
            </div>
            <div className="flex justify-between py-1">
              <dt className="text-gray-500">Email:</dt>
              <dd>{user?.email}</dd>
            </div>
          </dl>
          {done && <p className="pt-2 text-sm text-green-600">{done}</p>}
        </>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <div className="flex gap-2">
            <input
              className={field}
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <input
              className={field}
              placeholder="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>

          <div className="flex justify-between py-1">
            <span className="text-gray-500">Username</span>
            <span>{user?.username}</span>
          </div>

          <input
            className={field}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div className="space-y-2 border-t pt-3">
            <p className="text-xs text-gray-500">
              Leave blank to keep your current password
            </p>
            <input
              className={field}
              type="password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <input
              className={field}
              type="password"
              placeholder="Confirm new password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>

          {needsCurrent && (
            <div className="space-y-1 rounded-lg border border-amber-300 bg-amber-50 p-2">
              <p className="text-xs text-amber-700">
                Confirm your current password to change your email or password
              </p>
              <input
                className={field}
                type="password"
                placeholder="Current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy}
              className="rounded-full bg-orange-600 px-4 py-1.5 text-sm text-white transition hover:bg-orange-700 disabled:opacity-50 hover:cursor-pointer"
            >
              {busy ? "Saving..." : "Save changes"}
            </button>
            <button
              type="button"
              onClick={closeEditor}
              disabled={busy}
              className="rounded-full border px-4 py-1.5 text-sm transition hover:bg-gray-100 disabled:opacity-50 hover:cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AccountEditor;
