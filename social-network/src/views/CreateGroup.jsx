"use client";

import GroupIcon from "@/components/GroupIcon";
import { GROUPS_URL } from "@/lib/Api";
import { UploadMedia } from "@/lib/UploadMedia";
import { resizeImage } from "@/lib/resizeImage";
import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const CreateGroup = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [iconFile, setIconFile] = useState(null);
  const [iconPreview, setIconPreview] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onPickIcon = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (!["image/jpeg", "image/png"].includes(f.type)) {
      setError("Group icon must be a JPEG or PNG image");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError("Please choose an image under 10 MB");
      return;
    }
    setError("");
    try {
      const resized = await resizeImage(f, 200);
      setIconFile(resized);
      setIconPreview(URL.createObjectURL(resized));
    } catch {
      setError("Could not process that image");
    }
  };

  const validate = () => {
    const groupName = name.trim();
    if (!groupName) return "Group name is required";

    if (groupName.length < 3) return "Group name must be at least 3 characters";

    if (!/^[a-z0-9_]+$/i.test(groupName))
      return "Group name can only contain letters, numbers and undescores";

    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setError("");

    setSubmitting(true);

    try {
      let icon = "";
      if (iconFile) {
        const uploaded = await UploadMedia(iconFile);
        icon = uploaded.media;
      }

      const res = await axios.post(GROUPS_URL, {
        command: "insert",
        data: {
          name: name.trim(),
          description: description.trim(),
          isPrivate,
          icon,
        },
      });

      navigate("/g/" + res.data.group.name);
    } catch (err) {
      setError(err.response?.data?.message || "Could not create group");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-2xl font-bald">Create Group</h1>
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border p-6"
      >
        {error && (
          <div className="rounded border border-red-300 bg-red-50 p-2 text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="flex items-center gap-4">
          <GroupIcon src={iconPreview} size={64} />
          <label className="cursor-pointer rounded-full border px-4 py-2 text-sm transition hover:bg-gray-100">
            Choose icon
            <input
              type="file"
              accept="image/jpeg, image/png"
              onChange={onPickIcon}
              className="hidden"
            />
          </label>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Name</label>
          <div className="flex items-center rounded-full border px-3">
            <span className="text-gray-400">r/</span>
            <input
              className="w-full rounded-full py-2 pl-1 outline-none"
              placeholder="groupname"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Descripiton</label>
          <textarea
            className="w-full rounded-lg border p-2 text-sm"
            rows={3}
            placeholder="What is this group about?..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
          />
          Private Group (Only members can see posts)
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-orange-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-700 disabled:opacity-50"
        >
          {submitting ? "Creating..." : "Create group"}
        </button>
      </form>
    </div>
  );
};

export default CreateGroup;
