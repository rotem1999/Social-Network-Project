"use client";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { POSTS_URL } from "@/lib/Api";
import VoteCard from "./VoteCard";
import { CommentIcon, ShareIcon, KebabIcon } from "./Icons";
import GroupIcon from "@/components/GroupIcon";

const timeAgo = (date) => {
  const minutes = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (minutes < 1) return "just now";

  if (minutes < 60) return minutes + " m.";

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + " hr.";

  if (hours >= 47) return Math.floor(hours / 24) + " day";

  return Math.floor(hours / 24) + "days";
};

const slugify = (s) =>
  (s || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const PostCard = ({ post, onDeleted }) => {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [zoom, setZoom] = useState(false);

  const author = post.author || {};
  const group = post.group || {};
  const isOwner = (user?.id || user?._id) === author._id;

  const navigate = useNavigate();
  const postUrl = `/r/${group.name}/comments/${post._id}/${slugify(post.title)}`;

  const handleShare = async () => {
    const link = window.location.origin + postUrl;
    try {
      if (navigator.share)
        await navigator.share({ url: link, title: post.title });
      else await navigator.clipboard.writeText(link);
    } catch {}
  };

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

  const onCardClick = (e) => {
    if (e.target.closest("a, button, video, img")) return;
    navigate(postUrl);
  };

  return (
    <article
      className="rounded-xl border bg-white p-4 transition hover:shadow-sm hover:bg-gray-50 hover:cursor-pointer"
      onClick={onCardClick}
    >
      <div className="mb-2 flex items-start justify-between">
        <div className="flex items-center gap-2">
          {group.name && <GroupIcon src={group.icon} size={36} />}
          <div className="flex flex-col gap-0.5 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              {group.name && (
                <Link
                  to={"/g/" + group.name}
                  className="font-medium text-gray-700 hover:underline"
                >
                  r/{group.name}
                </Link>
              )}
              <span>•</span>
              <span>{timeAgo(post.createdAt)} ago</span>
            </div>
            <div className="flex items-center gap-2">
              <span>u/{author.username || "unknown"}</span>
            </div>
          </div>
        </div>
        {isOwner && (
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((open) => !open);
              }}
              aria-label="Post options"
              className="rounded-full px-2 py-1 leading-none text-gray-500 transition hover:bg-gray-100 hover:cursor-pointer"
            >
              <KebabIcon size={18} />
            </button>
            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                  }}
                />
                <div className="absolute right-0 z-20 mt-1 w-32 overflow-hidden rounded-lg border bg-white py-1 shadow-lg">
                  <Link
                    to={"/edit-post/" + post._id}
                    className="block px-3 py-1.5 text-sm transition hover:bg-gray-100"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={handleDelete}
                    disabled={busy}
                    className="block w-full px-3 py-1.5 text-left text-sm text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    {busy ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <h2 className="text-lg font-semibold">{post.title}</h2>

      {post.media && post.mediaType === "video" && (
        <div className="mt-2 overflow-hidden rounded-lg border bg-black">
          <video
            src={post.media}
            controls
            className="mx-auto block max-h-[512px] w-auto max-w-full"
          />
        </div>
      )}
      {post.media && post.mediaType === "image" && (
        <div className="mt-2 h-[512px] w-full overflow-hidden rounded-lg border bg-black">
          <img
            src={post.media}
            alt=""
            onClick={() => setZoom(true)}
            className="h-full w-full object-contain cursor-zoom-in"
          />
        </div>
      )}
      {post.content && (
        <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800 mt-4 mb-5">
          {post.content}
        </p>
      )}

      <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
        <span className="relative leading-[0]">
          <VoteCard
            postId={post._id}
            postScore={post.score}
            initialVote={post.myVote}
          />
        </span>

        <button
          onClick={() => navigate(postUrl)}
          className="flex items-center gap-1 rounded-full px-3 py-1 transition hover:bg-gray-100"
        >
          {<CommentIcon />}
          <span>Reply</span>
        </button>

        <button
          onClick={handleShare}
          className="flex items-center gap-1 rounded-full px-3 py-1 transition hover:bg-gray-100"
        >
          {<ShareIcon />}
          <span>Share</span>
        </button>
      </div>

      {zoom && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            setZoom(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
        >
          <img
            src={post.media}
            alt=""
            className="max-h-full max-w-full rounded-lg object-contain"
          />
        </div>
      )}
    </article>
  );
};

export default PostCard;
