"use client";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { POSTS_URL, GROUPS_URL } from "@/lib/Api";
import { useAuth } from "@/context/AuthContext";
import { UploadMedia } from "@/lib/UploadMedia";
import { resizeImageContain } from "@/lib/resizeImage";

const ACCEPTED = ["image/jpeg", "image/png", "video/mp4"];

const CreatePost = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [groups, setGroups] = useState([]);
  const [group, setGroup] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    axios
      .post(GROUPS_URL, { command: "select", data: {} })
      .then((res) => {
        const uid = user?.id || user?._id;
        const joined = (res.data.groups || []).filter((g) =>
          g.members?.some((id) => id === uid),
        );
        setGroups(joined);
      })
      .catch(() => setGroups([]));
  }, [user]);

  const onPick = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      setError("Only JPEG/PNG images and MP4 videos are allowed");
      return;
    }

    setError("");
    try {
      const processed = file.type.startsWith("image/")
        ? await resizeImageContain(file, 1080)
        : file;

      setFile(processed);
      setPreview(URL.createObjectURL(processed));
    } catch (err) {
      setError("Could not process that image");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !group) {
      setError("Title and group are required");
      return;
    }
    if (!content.trim() && !file) {
      setError("Add some text or an image/video");
      return;
    }
    setError("");

    setSubmitting(true);
    try {
      let media = "";
      let mediaType = "";
      if (file) {
        const uploaded = await UploadMedia(file);
        media = uploaded.media;
        mediaType = uploaded.mediaType;
      }

      await axios.post(POSTS_URL, {
        command: "insert",
        data: {
          title: title.trim(),
          content: content.trim(),
          group,
          media,
          mediaType,
        },
      });

      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Could not create post");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-4 text-2xl font-bold">Create a post</h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border p-6"
      >
        {error && (
          <div className="rounded border border-red-300 bg-red-50 p-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {groups.length === 0 ? (
          <p className="text-sm text-gray-500">
            You need to join or create a group before posting.
          </p>
        ) : (
          <select
            className="w-full rounded-full border px-4 py-2 text-sm"
            value={group}
            onChange={(e) => setGroup(e.target.value)}
          >
            <option value="">Choose a group</option>
            {groups.map((g) => (
              <option key={g._id} value={g.name}>
                r/{g.name}
              </option>
            ))}
          </select>
        )}

        <input
          className="w-full rounded-lg border p-2"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          className="w-full rounded-lg border p-2 text-sm"
          rows={4}
          placeholder="Text (optional if you add media)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        <input
          type="file"
          accept="image/jpeg,image/png,video/mp4"
          onChange={onPick}
        />

        {preview && file && (
          <div className="overflow-hidden rounded-lg border bg-black">
            {file.type.startsWith("video/") ? (
              <video
                src={preview}
                controls
                className="mx-auto block max-h-72 w-auto max-w-full"
              />
            ) : (
              <img
                src={preview}
                alt="preview"
                className="mx-auto block max-h-72 w-auto max-w-full"
              />
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || groups.length === 0}
          className="w-full rounded-full bg-orange-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-700 disabled:opacity-50"
        >
          {submitting ? "Posting..." : "Post"}
        </button>
      </form>
    </div>
  );
};

export default CreatePost;
