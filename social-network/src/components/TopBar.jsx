"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PlusIcon } from "@/components/Icons";

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
      <div className="flex flex-1 items-center gap-2">
        <button
          type="button"
          onClick={onMenu}
          aria-label="Open Menu"
          title="Menu"
          className="rounded p-2 transition hover:bg-gray-100"
        >
          <img src="/menu.svg" alt="" width={22} height={22} />
        </button>
        <span className="text-lg font-bold text-orange-600 [text-shadow:1px_1px_2px_rgba(0,0,0,0.2)]">
          Reddit like SN
        </span>
      </div>

      <form onSubmit={handleSearch} className="ml-auto flex w-40 sm:w-64">
        <input
          className="w-full max-w-md rounded-full border bg-gray-50 px-4 py-1.5 text-center text-sm transition focus:bg-white focus:text-left"
          placeholder="Search"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
      </form>
      <div className="flex flex-1 justify-end">
        <button
          type="button"
          onClick={() => navigate("/create-post")}
          aria-label="Create post"
          title="Create post"
          className="rounded-full bg-orange-600 p-2 text-white transition hover:bg-orange-700"
        >
          <PlusIcon />
        </button>
      </div>
    </header>
  );
};

export default TopBar;
