"use client";

import { useAuth } from "@/context/AuthContext";
import ContributionGraph from "@/components/ContributionGraph";
import AccountEditor from "@/components/AccountEditor";

const Account = () => {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Account</h1>
      <AccountEditor />

      <ContributionGraph />

      <button
        onClick={logout}
        className="rounded-full border px-4 py-2 text-sm transition hover: bg-gray-100 hover:cursor-pointer"
      >
        Log out
      </button>
    </section>
  );
};

export default Account;
