const mongoose = require("mongoose");

const GroupSchema = {
  name: { type: String, required: true, unique: true, lowercase: true },
  description: { type: String, default: "" },
  isPrivate: { type: Boolean, default: false },
  admins: [
    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  ],
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  pendingRequests: [
    { type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] },
  ],
  icon: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
};

module.exports = { GroupSchema };
