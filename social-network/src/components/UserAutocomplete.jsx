"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { USERS_URL } from "@/lib/Api";

const UserAutocomplete = ({
  term,
  setTerm,
  onPick,
  placeholder,
  exclude = [],
}) => {
  const [matches, setMatches] = useState([]);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const query = term.trim();
    if (!query) {
      setMatches([]);
      return;
    }

    const timer = setTimeout(() => {
      axios
        .post(USERS_URL, { command: "search", data: { term: query } })
        .then((res) => setMatches(res.data.users || []))
        .catch(() => setMatches([]));
    }, 200);

    return () => clearTimeout(timer);
  }, [term]);

  const visible = matches.filter((one) => !exclude.includes(one.username));

  return (
    <div className="relative">
      <input
        className="w-full rounded border px-2 py-1 text-sm"
        placeholder={placeholder}
        value={term}
        onChange={(e) => {
          setTerm(e.target.value);
          setShow(true);
        }}
        onFocus={() => setShow(true)}
        onBlur={() => setTimeout(() => setShow(false), 150)}
      />
      {show && visible.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-40 w-full overflow-auto rounded-lg border bg-white shadow-lg">
          {visible.map((one) => (
            <li key={one._id}>
              <button
                type="button"
                onMouseDown={() => {
                  onPick(one);
                  setShow(false);
                }}
                className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 hover:cursor-pointer"
              >
                u/{one.username}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default UserAutocomplete;
