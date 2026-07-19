"use client";
import { useEffect, useState } from "react";

export default function Front() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleCommand = (action) => {
    return null;
  };

  useEffect(() => {}, []);

  return (
    <div className="p-10 space-y-10 mt-80">
      <h1 className="text-3xl font-bold mb-10">User Management System</h1>
      <div className="grid grid-cols-1 md:grid-cols-2" gap-10>
        <input
          className="border p2 rounded"
          placeholder="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="border p2 rounded"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="border p2 rounded"
          placeholder="userID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />
        <input
          className="border p2 rounded"
          placeholder="New Email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          className="bg-blue-500 text-white p-5 rounded"
          onClick={handleCommand("insert")}
        >
          insert
        </button>
        <button
          className="bg-blue-500 text-white p-5 rounded"
          onClick={handleCommand("update")}
        >
          update
        </button>
        <button
          className="bg-blue-500 text-white p-5 rounded"
          onClick={handleCommand("fetchUsers")}
        >
          refresh
        </button>
      </div>
      {message && (
        <div className="p-5 bg-gray-100 border rounded mt-10">{message}</div>
      )}
    </div>
  );
}
