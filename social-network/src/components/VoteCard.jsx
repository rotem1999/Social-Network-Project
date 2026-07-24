"use client";
import { useState } from "react";
import axios from "axios";
import { POSTS_URL } from "@/lib/Api";
import { UpArrow, DownArrow } from "./Icons";

const VoteCard = ({ postId, postScore = 0, initialVote = 0 }) => {
  const [score, setScore] = useState(postScore);
  const [myVote, setMyVote] = useState(initialVote);

  const vote = async (dir) => {
    const prevVote = myVote;
    const prevScore = score;
    const next = myVote === dir ? 0 : dir;
    setMyVote(next);
    setScore((score) => score + (next - myVote));
    try {
      await axios.post(POSTS_URL, {
        command: "vote",
        data: { postId, value: next },
      });
    } catch {
      setMyVote(prevVote);
      setScore(prevScore);
    }
  };

  return (
    <span className="flex items-center rounded-full bg-gray-100">
      <button
        onClick={() => vote(1)}
        aria-label="Upvote"
        className={
          "rounded-full p-1.5 transition hover:text-orange-600 " +
          (myVote === 1 ? "text-orange-600" : "text-gray-600")
        }
      >
        {<UpArrow />}
      </button>
      <span className="min-w-[1.5rem] text-center text-xs font-medium">
        {score}
      </span>
      <button
        onClick={() => vote(-1)}
        aria-label="Downvote"
        className={
          "rounded-full p-1.5 transition hover:text-blue-600 " +
          (myVote === -1 ? "text-blue-600" : "text-gray-600")
        }
      >
        {<DownArrow />}
      </button>
    </span>
  );
};

export default VoteCard;
