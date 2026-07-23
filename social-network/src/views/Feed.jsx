"use client";

import axios from "axios";
import { useState, useEffect } from "react";
import { POSTS_URL } from "@/lib/api";

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadFeed = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await axios.post(POSTS_URL, {
        command: "select",
        data: { feed: true },
      });
      setPosts(res.data.posts || []);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load your seed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, []);

  const handleDeleted = (id) =>
    setPosts((prev) => prev.filter((pr) => pr._id !== id));

  if (loading) {
    return (
      <p className="py-10 text-center text-sm text-gray-500">Loading feed...</p>
    );
  }

  if (error) {
    return (
      <div className="py-10 text-center">
        <p className="text-sm text-red-600">{error}</p>
        <button
          onClick={loadFeed}
          className="mt-2 rounded-full border px-4 py-1.5 text-sm transition hover:bg-gray-100"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <PostCard key={post._id} post={post} onDeleted={handleDeleted} />
      ))}
    </div>
  );
};

export default Feed;
