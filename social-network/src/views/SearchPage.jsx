"use client";
import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import axios from "axios";
import SearchFilter from "@/components/SearchFilter";
import { POSTS_URL, GROUPS_URL } from "@/lib/Api";
import GroupIcon from "@/components/GroupIcon";
import { LockIcon } from "@/components/Icons";

const slugify = (s) =>
  (s || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const postUrl = (p) =>
  `/r/${p.group?.name}/comments/${p._id}/${slugify(p.title)}`;

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const q = searchParams.get("q") || "";

  const [filterOpen, setFilterOpen] = useState(false);

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [allGroups, setAllGroups] = useState([]);

  useEffect(() => {
    axios
      .post(GROUPS_URL, { command: "select", data: {} })
      .then((res) => setAllGroups(res.data.groups || []))
      .catch(() => setAllGroups([]));
  }, []);

  const runSearch = async (params) => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(POSTS_URL, {
        command: "select",
        data: params,
      });
      setResults(res.data.posts || []);
    } catch (err) {
      setError(err.response?.data?.message || "Search failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSearch(q.trim() ? { keyword: q.trim() } : {});
  }, [q]);

  const groupQuery = q.trim().toLowerCase();
  const groupResults = groupQuery
    ? allGroups.filter(
        (g) =>
          g.name?.toLowerCase().includes(groupQuery) ||
          g.description?.toLowerCase().includes(groupQuery),
      )
    : [];

  return (
    <div className="mx-auto max-w-2xl space-y-3">
      <div className="flex items-center gap-2 border-b pb-2">
        <button
          onClick={() => setFilterOpen((o) => !o)}
          className={
            "rounded-full border px-3 py-1 text-sm transition hover:bg-gray-100 hover:cursor-pointer " +
            (filterOpen ? "bg-gray-100" : "")
          }
        >
          Filter
        </button>
        <h1 className="text-sm text-gray-600">
          Results for{" "}
          <span className="font-medium text-orange-600">{q || "…"}</span>
        </h1>
      </div>

      {filterOpen && (
        <SearchFilter
          q={q}
          onApply={(params) => {
            setFilterOpen(false);
            runSearch(params);
          }}
        />
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <p className="text-xs font-medium text-gray-500">Posts</p>
      {loading ? (
        <p className="py-6 text-center text-sm text-gray-500">Searching...</p>
      ) : results.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500">
          No posts found.
        </p>
      ) : (
        <div className="space-y-2">
          {results.map((post) =>
            post.locked ? (
              <Link
                key={post._id}
                to={"/g/" + post.group?.name}
                className="flex items-center gap-3 rounded-xl border border-dashed p-3 text-sm text-gray-500 transition hover:bg-gray-50"
              >
                <span className="text-xl">{<LockIcon size={22} />}</span>
                <div className="min-w-0">
                  <p className="font-medium">Private group — join to view</p>
                  <p className="text-xs">r/{post.group?.name}</p>
                </div>
              </Link>
            ) : (
              <Link
                key={post._id}
                to={postUrl(post)}
                className="flex items-center gap-3 rounded-xl border p-3 transition hover:bg-gray-50"
              >
                {post.media &&
                  (post.mediaType === "video" ? (
                    <video
                      src={post.media}
                      muted
                      className="h-16 w-16 shrink-0 rounded object-cover"
                    />
                  ) : (
                    <img
                      src={post.media}
                      alt=""
                      className="h-16 w-16 shrink-0 rounded object-cover"
                    />
                  ))}
                <div className="min-w-0">
                  <p className="truncate font-medium">{post.title}</p>
                  <p className="text-xs text-gray-500">
                    r/{post.group?.name} • u/{post.author?.username} •{" "}
                    {post.score} pts
                  </p>
                </div>
              </Link>
            ),
          )}
        </div>
      )}

      {groupResults.length > 0 && (
        <div className="space-y-2 border-t pt-3">
          <p className="text-xs font-medium text-gray-500">Communities</p>
          {groupResults.map((g) => (
            <Link
              key={g._id}
              to={"/g/" + g.name}
              className="flex items-center gap-3 rounded-xl border p-3 transition hover:bg-gray-50"
            >
              <GroupIcon src={g.icon} size={40} />
              <div className="min-w-0">
                <p className="font-medium">r/{g.name}</p>
                <p className="truncate text-xs text-gray-500">
                  {g.description || "No description"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchPage;
