"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";

const TopBar = ({ onMenu }) => {
  const navigate = useNavigate();
  const [term, setTerm] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    const query = term.trim();
    if (!query) return;

    navigate("/search?q=" + encodeURIComponent(query));
  };

  return (
    <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-2 border-b bg-white px-3">
      <button
        type="button"
        onClick={onMenu}
        aria-label="Open Menu"
        title="Menu"
        className="rounded p-2 transition hover:bg-gray-100"
      >
        <img src="/menu.svg" alt="" width={22} height={22} />
      </button>
      <span className="text-lg font-bold text-orange-600 [text-shadow:1px_1px_2px_rgba(0,0,0,0.2)">
        Reddit like SN
      </span>

      <form onSubmit={handleSearch} className="m1-auto flex w-40 sm:w-64">
        <input
          className="w-full rounded-full border bg-gray-50 px-4 py-1.5 text-sm transition focus:bg-white"
          placeholder="Search"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
        <button
          type="button"
          onClick={() => navigate("/create-post")}
          className="rounded-full bg-orange-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-orange-700"
        >
          + Post
        </button>
      </form>
    </header>
  );
};

export default TopBar;
