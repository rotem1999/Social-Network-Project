"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { GROUPS_URL } from "@/lib/Api";
import { HomeIcon, PlusIcon, XIcon } from "@/components/Icons";
import GroupIcon from "@/components/GroupIcon";
import NavItem from "./NavItem";

const GroupsDrawer = ({ open, onClose }) => {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    if (!open) return;
    axios
      .post(GROUPS_URL, { command: "select", data: {} })
      .then((res) => {
        const uid = user?.id || user?._id;
        const joined = (res.data.groups || []).filter((g) =>
          g.members?.some((id) => id === uid),
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
          "fixed inset-y-0 left-0 top-14 z-50 w-72 max-w-[80%] bg-white shadow-xl transition-transform duration-300 " +
          (open ? "translate-x-0" : "-translate-x-full")
        }
      >
        <div className="relative px-3 pt-4">
          <ul className="space-y-1">
            <li>
              <NavItem
                to="/"
                end
                label="Home"
                icon={HomeIcon}
                onClick={onClose}
              />
            </li>
            <li>
              <NavItem
                to="/create-group"
                end
                label="Create Group"
                icon={PlusIcon}
                onClick={onClose}
              />
            </li>
          </ul>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className={
              "absolute right-0 top-8 -translate-y-1/2 translate-x-1/2 rounded-full border bg-white p-1.5 text-gray-600 shadow-sm transition hover:bg-gray-100 " +
              (open
                ? "cursor-pointer opacity-100"
                : "pointer-events-none opacity-0")
            }
          >
            <XIcon size={16} />
          </button>
        </div>
        <hr className="opacity-10 mt-5 mb-5" />
        <div className="mt-4 px-4 pb-1">
          <h2 className="font-bold">Your groups</h2>
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
                className="flex items-center gap-2 rounded px-3 py-2 text-sm transition hover:bg-gray-100"
              >
                <GroupIcon src={group.icon} size={24} />
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
