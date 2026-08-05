"use client";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { POSTS_URL } from "@/lib/Api";
import PostCard from "@/components/PostCard";

const PAGE_SIZE = 5;

const groupId = (p) => p.group?._id || p.group;

const interleaveByGroup = (list) => {
  const remaining = [...list];
  const result = [];
  while (remaining.length) {
    let idx = remaining.findIndex(
      (p) =>
        !(
          result.length >= 2 &&
          groupId(result[result.length - 1]) === groupId(p) &&
          groupId(result[result.length - 2]) === groupId(p)
        ),
    );
    if (idx === -1) idx = 0;
    result.push(remaining.splice(idx, 1)[0]);
  }
  return result;
};

const Feed = () => {
  const [allPosts, setAllPosts] = useState([]);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const sentinelRef = useRef(null);

  const loadFeed = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(POSTS_URL, {
        command: "select",
        data: { feed: true },
      });
      setAllPosts(interleaveByGroup(res.data.posts || []));
      setVisible(PAGE_SIZE);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load your feed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, []);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible((c) => Math.min(c + PAGE_SIZE, allPosts.length));
        }
      },
      { rootMargin: "200px" },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [allPosts.length]);

  const handleDeleted = (id) =>
    setAllPosts((prev) => prev.filter((p) => p._id !== id));

  if (loading) {
    return (
      <p className="py-10 text-center text-sm text-gray-500">Loading feed…</p>
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

  const shown = allPosts.slice(0, visible);
  const end = visible >= allPosts.length;

  return (
    <div className="space-y-3">
      {shown.map((post) => (
        <PostCard key={post._id} post={post} onDeleted={handleDeleted} />
      ))}

      <div ref={sentinelRef} />

      {allPosts.length === 0 && (
        <p className="py-10 text-center text-sm text-gray-500">
          Your feed is empty. Join groups or add friends to see posts.
        </p>
      )}
      {end && allPosts.length > 0 && (
        <p className="py-8 text-center text-sm text-gray-400">
          Oops, that&apos;s the end — you&apos;re all caught up.
        </p>
      )}
    </div>
  );
};

export default Feed;
