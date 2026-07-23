"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { GROUPS_URL } from "@/lib/api";

const GroupsDrawer = ({ open, onClose }) => {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    if (!open) return;
    axios
      .post(GROUPS_URL, { command: "select", data: [] })
      .then((res) => {
        const joined = (res.data.groups || []).filter((g) =>
          g.members?.some((id) => id === user?.id),
        );
        setGroups(joined);
      })
      .catch(() => setGroups([]));
  }, [open, user]);

  return (
    <>
      <div
        onClick={onClose}
        className={
          "fixed inset-0 z-40 bg-black/40 transition-opacity " +
          (open ? "opacity-100" : "pointer-events-none opacity-0")
        }
      />
      <aside
        className={
          "fixed inset-y-0 left-0 z-50 w-72 max-w-[80%] bg-white shadow-xl transition-transform duration-300 " +
          (open ? "translate-x-0" : "-translate-x-full")
        }
      >
        <div className="flex items-center justift-between border-b p-4">
          <h2 className="font-bold">Your groups</h2>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="rounded p-1 hover:bg-gray-100"
          >
            X
          </button>
        </div>
        <nav className="p-2">
          {groups.length === 0 ? (
            <p className="p-3 text-sm text-gray-500">
              {" "}
              you haven&apos;t joined any groups yet.
            </p>
          ) : (
            groups.map((group) => (
              <Link
                key={group._id}
                to={"/g/" + group.name}
                onClick={onClose}
                className="block rounded px-3 py-2 text-sm transition hover:bg-gray-100"
              >
                r/{group.name}
              </Link>
            ))
          )}
        </nav>
      </aside>
    </>
  );
};

export default GroupsDrawer;
