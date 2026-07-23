"use client";
import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { POSTS_URL } from "@/lib/Api";

const timeAgo = (date) => {
  const minutes = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (minutes < 1) return "just now";

  if (minutes < 60) return minutes + " m.";

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + " hr.";

  if (hours >= 47) return Math.floor(hours / 24) + " day";

  return Math.floor(hours / 24) + "days";
};

const PostCard = ({ post, onDeleted }) => {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);

  const author = post.author || {};
  const group = post.group || {};
  const isOwner = user?.id === author.id;

  const handleDelete = async () => {
    if (!confirm("Delete this post?")) return;

    setBusy(true);
    try {
      await axios.post(POSTS_URL, {
        command: "delete",
        data: { postId: post._id },
      });
      onDeleted?.(post._id);
    } catch {
      setBusy(false);
    }
  };

  return (
    <article className="rounded-xl border bg-white p-4 transition hover:shadow-sm">
      <div className="mb-1 flex flex-col gap-0.5 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          {group.name && (
            <Link
              to={"/g/" + group.name}
              className="font-medium text-gray-700 hover:undeline"
            >
              r/{group.name}
            </Link>
          )}
          <span>•</span>
          <span>{timeAgo(post.createdAt)} ago</span>
        </div>
        <div className="flex items-center gap-2">
          <span>u/{author.username || "unkown"}</span>
        </div>
      </div>

      <h2 className="text-lg font-semibold">{post.title}</h2>

      {post.media && post.mediaType === "video" && (
        <video
          src={post.media}
          controls
          className="mt-2 w-full rounded-lg border"
        />
      )}
      {post.media && post.mediaType === "image" && (
        <img
          src={post.media}
          controls
          className="mt-2 w-full rounded-lg border object-cover"
        />
      )}
      {post.content && (
        <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800">
          {post.content}
        </p>
      )}

      {isOwner && (
        <div className="mt-3 flex gap-2">
          <Link
            to={"/edit-post/" + post._id}
            className="rounded-full border px-3 py-1 text-xs transition hover:bg-gray-100"
          >
            edit
          </Link>
          <button
            onClick={handleDelete}
            disabled={busy}
            className="rounded-full border border-red-200 px-3 py-1 text-xs text-red-600 transition hover:bg-red-50 disabled:opacity-50"
          >
            {busy ? "Deleting..." : "Delete"}
          </button>
        </div>
      )}
    </article>
  );
};

export default PostCard;
