"use client";

import { useAuth } from "@/context/AuthContext";

const Account = () => {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Account</h1>
      <dl className="rounded-2xl border p-4 text-sm">
        <div className="flex justify-between py-1">
          <dt className="text-gray-500">Name:</dt>
          <dd>
            {user.firstName} {user.lastName}
          </dd>
        </div>
        <div className="flex justify-between py-1">
          <dt className="text-gray-500">Username</dt>
          <dd>{user.username}</dd>
        </div>
        <div className="flex justify-between py-1">
          <dt className="text-gray-500">Email:</dt>
          <dd>{user.email}</dd>
        </div>
      </dl>

      <button
        onClick={logout}
        className="rounded-full border px-4 py-2 text-sm transition hover: bg-gray-100"
      >
        Log out
      </button>
    </section>
  );
};

export default Account;
