"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PlusIcon } from "@/components/Icons";
import axios from "axios";
import { GROUPS_URL } from "@/lib/Api";
import GroupIcon from "@/components/GroupIcon";

const TopBar = ({ onMenu }) => {
  const navigate = useNavigate();
  const [term, setTerm] = useState("");
  const [groups, setGroups] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);

  useEffect(() => {
    axios
      .post(GROUPS_URL, { command: "select", data: {} })
      .then((res) => setGroups(res.data.groups || []))
      .catch(() => setGroups([]));
  }, []);

  const isGroupQuery = term.trim().toLowerCase().startsWith("r/");
  const groupTerm = term.trim().slice(2).toLowerCase();
  const groupMatches = isGroupQuery
    ? groups
        .filter((g) => g.name?.toLowerCase().includes(groupTerm))
        .slice(0, 8)
    : [];

  const goToGroup = (name) => {
    setTerm("");
    setShowSuggest(false);
    navigate("/g/" + name);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const query = term.trim();
    if (!query) return;

    if (isGroupQuery) {
      const target = groupMatches[0]?.name || query.slice(2);
      if (target) goToGroup(target);
      return;
    }

    setShowSuggest(false);
    navigate("/search?q=" + encodeURIComponent(query));
  };

  return (
    <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-2 border-b bg-white px-3">
      <div className="flex flex-1 items-center gap-2">
        <button
          type="button"
          onClick={onMenu}
          aria-label="Open Menu"
          title="Menu"
          className="rounded-full p-2 transition hover:bg-gray-100 hover:cursor-pointer"
        >
          <img src="/menu.svg" alt="" width={22} height={22} />
        </button>
        <span
          onClick={() => navigate("/")}
          className="font-display text-lg text-orange-600 [text-shadow:1px_1px_2px_rgba(0,0,0,0.2)] hover:cursor-pointer"
        >
          REDDIT CLONE
        </span>
      </div>

      <form
        onSubmit={handleSearch}
        className="relative ml-auto flex w-40 sm:w-64"
      >
        <input
          className="w-full max-w-md rounded-full border bg-gray-50 hover:bg-gray-100 px-4 py-1.5 text-center text-sm transition focus:bg-white focus:text-left"
          placeholder="Search or r/community"
          value={term}
          onChange={(e) => {
            setTerm(e.target.value);
            setShowSuggest(true);
          }}
          onFocus={() => setShowSuggest(true)}
          onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
        />
        {showSuggest && isGroupQuery && groupMatches.length > 0 && (
          <ul className="absolute left-0 top-full z-40 mt-1 w-full overflow-hidden rounded-lg border bg-white shadow-lg">
            {groupMatches.map((g) => (
              <li key={g._id}>
                <button
                  type="button"
                  onMouseDown={() => goToGroup(g.name)}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-gray-100"
                >
                  <GroupIcon src={g.icon} size={20} />
                  r/{g.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </form>
      <div className="flex flex-1 justify-end">
        <button
          type="button"
          onClick={() => navigate("/create-post")}
          aria-label="Create post"
          title="Create post"
          className="rounded-full bg-orange-600 p-2 text-white transition hover:bg-orange-700 hover:cursor-pointer"
        >
          <PlusIcon />
        </button>
      </div>
    </header>
  );
};

export default TopBar;
