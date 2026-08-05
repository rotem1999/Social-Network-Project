"use client";

import GroupIcon from "@/components/GroupIcon";
import PostCard from "@/components/PostCard";
import { useAuth } from "@/context/AuthContext";
import { GROUPS_URL, POSTS_URL } from "@/lib/Api";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { ClockIcon, LockIcon } from "@/components/Icons";
import GroupActivityChart from "@/components/GroupActivityChart";

const GroupPage = () => {
  const { name } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const uid = user?.id || user?._id;

  const [group, setGroup] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);

  const load = () => {
    setLoading(false);
    Promise.all([
      axios.post(GROUPS_URL, { command: "select", data: { name } }),
      axios.post(POSTS_URL, { command: "select", data: { group: name } }),
    ])
      .then(([group, post]) => {
        setGroup(group.data.groups?.[0] || null);
        setPosts(post.data.posts || []);
      })
      .catch((err) =>
        setError(err.response?.data?.message || "Could not load group"),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [name]);

  const idOf = (x) => x?._id || x;
  const isMember = group?.members?.some((member) => idOf(member) === uid);
  const isAdmin = group?.admins?.some((member) => idOf(member) === uid);
  const adminIds = new Set((group?.admins || []).map(idOf));

  const action = async (command, data = {}) => {
    setBusy(true);

    try {
      await axios.post(GROUPS_URL, { command, data: { name, ...data } });
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Action failed");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm("delete this group?")) return;

    setBusy(true);
    try {
      await axios.post(GROUPS_URL, { command: "delete", data: { name } });
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete this group");
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <p className="py-10 text-center text-sm text-gray-500">Loading...</p>
    );
  }

  if (error)
    return <p className="py-10 text-center text-sm text-red-600">{error}</p>;

  if (!group) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-4 min-w-150">
      <div className="flex items-center gap-3 rounded-xl border p-4">
        <GroupIcon src={group.icon} size={56} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">r/{group.name}</h1>
            {group.isPrivate && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                Private
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600">
            {group.description || "No description"}
          </p>
          {group.members && (
            <p className="text-xs text-gray-500">
              {group.members.length} members
            </p>
          )}
        </div>
        {isMember ? (
          <button
            onClick={() => action("leave")}
            disabled={busy}
            className="rounded-full border px-4 py-1.5 text-sm transition hover:bg-gray-200 disabled:opacity-50 hover:cursor-pointer"
          >
            Leave
          </button>
        ) : group.requested ? (
          <span className="flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-4 py-1.5 text-sm font-medium text-amber-700">
            <ClockIcon size={16} />
            Request pending approval
          </span>
        ) : (
          <button
            onClick={() => action("join")}
            disabled={busy}
            className="rounded-full bg-orange-600 px-4 py-1.5 text-sm text-white transition hover:bg-orange-700 disabled:opacity-50"
          >
            {group.isPrivate ? "Request to join" : "Join"}
          </button>
        )}
      </div>

      {isAdmin && (
        <div className="space-y-3 rounded-xl border border-blue-500 p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Admin Menu</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setMembersOpen((o) => !o)}
                className="rounded-full border px-3 py-1 text-xs transition hover:bg-gray-100 hover:cursor-pointer"
              >
                Members
              </button>
              <button
                onClick={remove}
                disabled={busy}
                className="rounded-full border border-red-200 px-3 py-1 text-xs text-red-600 transition hover:bg-red-50 disabled:opacity-50 hover:cursor-pointer"
              >
                Delete group
              </button>
            </div>
          </div>
          {group.isPrivate && (
            <div className="space-y-2 border-t pt-2">
              <p className="text-xs text-gray-500">Pending join requests</p>
              {group.pendingRequests?.length === 0 ? (
                <p className="text-sm text-gray-400">No pending requests</p>
              ) : (
                group.pendingRequests.map((req) => {
                  const rid = idOf(req);
                  return (
                    <div
                      key={rid}
                      className="flex items-center justify-between text-sm"
                    >
                      <span>u/{req.username || rid}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            action("approve", { username: req.username })
                          }
                          disabled={busy}
                          className="rounded-full border border-green-300 px-3 py-1 text-xs text-green-700 transition hover:bg-green-50 disabled:opacity-50 hover:cursor-pointer"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() =>
                            action("reject", { username: req.username })
                          }
                          disabled={busy}
                          className="rounded-full border border-red-200 px-3 py-1 text-xs text-red-600 transition hover:bg-red-50 disabled:opacity-50 hover:cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {membersOpen && (
            <div className="space-y-1 border-t pt-2">
              <p className="text-xs text-gray-500">Members</p>
              <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
                {group.members?.map((member) => {
                  const mid = idOf(member);
                  return (
                    <div
                      key={mid}
                      className="flex break-inside-avoid items-center justify-between py-0.5 text-sm"
                    >
                      <span>
                        u/{member.username || mid}
                        {adminIds.has(mid) && (
                          <span className="ml-1 text-xs text-gray-400">
                            (admin)
                          </span>
                        )}
                      </span>
                      {!adminIds.has(mid) && mid !== uid && (
                        <button
                          onClick={() =>
                            action("kick", { username: member.username })
                          }
                          disabled={busy}
                          className="rounded-full border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50 hover:cursor-pointer"
                        >
                          Kick
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {(!group?.isPrivate || isMember) && (
        <GroupActivityChart name={name} weeks={26} refreshKey={posts.length} />
      )}

      <div className="space-y-3">
        {group?.isPrivate && !isMember ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-10 text-center text-sm text-gray-500">
            <LockIcon size={28} />
            <p className="font-medium">This community is private</p>
            <p className="text-xs">Join to see its posts.</p>
          </div>
        ) : posts.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500">
            No posts in this group yet.
          </p>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              onDeleted={(id) =>
                setPosts((ps) => ps.filter((p) => p._id !== id))
              }
            />
          ))
        )}
      </div>
    </div>
  );
};

export default GroupPage;
