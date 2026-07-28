"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { POSTS_URL, COMMENTS_URL } from "@/lib/Api";
import { useAuth } from "@/context/AuthContext";
import PostCard from "@/components/PostCard";
import { ArrowLeftIcon } from "@/components/Icons";
import AddComment from "@/components/AddComment";
import CommentCard from "@/components/CommentCard";

const buildTree = (flat, uid) => {
  const byId = {};
  flat.forEach((c) => (byId[c._id] = { ...c, replies: [] }));
  const roots = [];
  flat.forEach((c) => {
    const node = byId[c._id];
    const parent = c.parent && byId[c.parent];
    if (parent) parent.replies.push(node);
    else roots.push(node);
  });

  const rank = (c) => (c.author?._id === uid ? 0 : 1);
  const sortLevel = (list) => {
    list.sort((a, b) => {
      const mine = rank(a) - rank(b);
      if (mine !== 0) return mine;

      const byScore = (b.score || 0) - (a.score || 0);
      if (byScore !== 0) return byScore;

      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    list.forEach((c) => sortLevel(c.replies));
  };
  sortLevel(roots);

  return roots;
};

const PostPage = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const uid = user?.id || user?._id;

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ok = true;
    setLoading(true);
    Promise.all([
      axios.post(POSTS_URL, { command: "select", data: { postId } }),
      axios.post(COMMENTS_URL, { command: "select", data: { postId } }),
    ])
      .then(([post, comment]) => {
        if (!ok) return;

        setPost(post.data.post);
        setComments(comment.data.comments || []);
      })
      .catch(
        (err) =>
          ok && setError(err.response?.data?.message || "Could not load post"),
      )
      .finally(() => ok && setLoading(false));

    return () => {
      ok = false;
    };
  }, [postId]);

  const tree = useMemo(() => buildTree(comments, uid), [comments, uid]);

  const handleAdded = (comment) => setComments((prev) => [...prev, comment]);
  const handleDeleted = (id) =>
    setComments((prev) => prev.filter((comment) => comment._id !== id));

  const handleUpdated = (updated) =>
    setComments((prev) =>
      prev.map((comment) => (comment._id === updated._id ? updated : comment)),
    );

  if (loading)
    return (
      <p className="py-10 text-center text-sm text-gray-500">Loading...</p>
    );

  if (error)
    return <p className="py-10 text-center text-sm text-red-600">{error}</p>;

  if (!post) return null;

  return (
    <div className="mx-auto max-w-4xl space-y-4 min-w-2xl">
      <div className="relative">
        <button
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="absolute right-full top-3 mr-2 rounded-full p-1.5 text-gray-600 transition hover:bg-gray-100 hover:cursor-pointer"
        >
          <ArrowLeftIcon size={20} />
        </button>
        <PostCard post={post} onDeleted={() => navigate("/")} />
      </div>
      <AddComment postId={postId} onAdded={handleAdded} />

      <div className="rounded-xl border p-3">
        {tree.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-500">
            No Comments yet.
          </p>
        ) : (
          tree.map((comment) => (
            <CommentCard
              key={comment._id}
              comment={comment}
              postId={postId}
              currentUserId={uid}
              onAdded={handleAdded}
              onDeleted={handleDeleted}
              onUpdated={handleUpdated}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default PostPage;
