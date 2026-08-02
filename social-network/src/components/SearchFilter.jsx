"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { GROUPS_URL } from "@/lib/Api";
import GroupIcon from "@/components/GroupIcon";

const SearchFilter = ({ q, onApply }) => {
  const [filters, setFilters] = useState({
    title: "",
    author: "",
    community: "",
  });
  const [active, setActive] = useState({
    title: false,
    author: false,
    community: false,
  });
  const [allGroups, setAllGroups] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);

  useEffect(() => {
    axios
      .post(GROUPS_URL, { command: "select", data: {} })
      .then((res) => setAllGroups(res.data.groups || []))
      .catch(() => setAllGroups([]));
  }, []);

  const update = (field) => (e) =>
    setFilters((f) => ({ ...f, [field]: e.target.value }));
  const toggle = (field) => () =>
    setActive((a) => ({ ...a, [field]: !a[field] }));

  const communityMatches = allGroups
    .filter((g) =>
      g.name?.toLowerCase().includes(filters.community.trim().toLowerCase()),
    )
    .slice(0, 8);

  const submit = (e) => {
    e.preventDefault();
    const params = {};
    if (active.title && filters.title.trim())
      params.keyword = filters.title.trim();
    else if (q.trim()) params.keyword = q.trim();
    if (active.author && filters.author.trim())
      params.author = filters.author.trim();
    if (active.community && filters.community.trim())
      params.group = filters.community.trim();
    onApply(params);
  };

  return (
    <form onSubmit={submit} className="space-y-2 rounded-xl border p-3 text-sm">
      <p className="text-xs text-gray-500">Check the fields to apply</p>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={active.title}
          onChange={toggle("title")}
        />
        <input
          className="w-full rounded border p-2 disabled:bg-gray-50 disabled:text-gray-400"
          placeholder="Post title contains..."
          value={filters.title}
          onChange={update("title")}
          disabled={!active.title}
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={active.author}
          onChange={toggle("author")}
        />
        <input
          className="w-full rounded border p-2 disabled:bg-gray-50 disabled:text-gray-400"
          placeholder="Post author (username)"
          value={filters.author}
          onChange={update("author")}
          disabled={!active.author}
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={active.community}
          onChange={toggle("community")}
        />
        <div className="relative w-full">
          <input
            className="w-full rounded border p-2 disabled:bg-gray-50 disabled:text-gray-400"
            placeholder="In community (group name)"
            value={filters.community}
            onChange={(e) => {
              update("community")(e);
              setShowSuggest(true);
            }}
            onFocus={() => setShowSuggest(true)}
            onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
            disabled={!active.community}
          />
          {active.community &&
            showSuggest &&
            filters.community.trim() &&
            communityMatches.length > 0 && (
              <ul className="absolute z-10 mt-1 max-h-40 w-full overflow-auto rounded-lg border bg-white shadow-lg">
                {communityMatches.map((g) => (
                  <li key={g._id}>
                    <button
                      type="button"
                      onMouseDown={() => {
                        setFilters((f) => ({ ...f, community: g.name }));
                        setShowSuggest(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-gray-100"
                    >
                      <GroupIcon src={g.icon} size={20} />
                      r/{g.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-full bg-orange-600 px-4 py-1.5 text-white hover:cursor-pointer"
        >
          Apply
        </button>
        <button
          type="button"
          onClick={() => {
            setFilters({ title: "", author: "", community: "" });
            setActive({ title: false, author: false, community: false });
          }}
          className="rounded-full border px-4 py-1.5 hover:cursor-pointer"
        >
          Clear
        </button>
      </div>
    </form>
  );
};

export default SearchFilter;
