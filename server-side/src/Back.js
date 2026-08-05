const express = require("express");
const mongoose = require("mongoose");
const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const serviceAccount = require("../social-network-prj-firebase.json");
const cors = require("cors");
const bodyParser = require("body-parser");
const { UserSchema } = require("./Schemas/UserSchema");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { GroupSchema } = require("./Schemas/GroupSchema");
const { PostSchema } = require("./Schemas/PostSchema");
const { CommentSchema } = require("./Schemas/CommentSchema");
const http = require("http");
const { initChatToken } = require("./ChatSocket");
const { ConversationSchema } = require("./Schemas/ConversationSchema");
const { MessageSchema } = require("./Schemas/MessageSchema");

const saltRounds = 10;
const app = express();
app.use(cors());
app.use(bodyParser.json());

// initialize mongoose
mongoose.connect(process.env.MONGODB_URI);

// initialize firebase
initializeApp({ credential: cert(serviceAccount) });

const userSchema = new mongoose.Schema(UserSchema);
const groupSchema = new mongoose.Schema(GroupSchema);
const postSchema = new mongoose.Schema(PostSchema);
const commentSchema = new mongoose.Schema(CommentSchema);
const conversationSchema = new mongoose.Schema(ConversationSchema);
const messageSchema = new mongoose.Schema(MessageSchema);

const User = mongoose.model("User", userSchema);
const Group = mongoose.model("Group", groupSchema);
const Post = mongoose.model("Post", postSchema);
const Comment = mongoose.model("Comment", commentSchema);
const Conversation = mongoose.model("Conversation", ConversationSchema);
const Message = mongoose.model("Message", MessageSchema);

const verifyToken = async (req) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return null;
  }

  try {
    const payload = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);

    return await User.findById(payload.userId);
  } catch (err) {
    return null;
  }
};

const checkIfLoggedIn = async (req, res) => {
  const verified = await verifyToken(req);
  if (!verified) {
    res.status(401).json({ message: "not logged in" });
    return null;
  }
  return verified;
};

app.post("/api/users", async (req, res) => {
  const { command, data } = req.body;

  try {
    switch (command) {
      case "login":
        if (!data.username || !data.password) {
          return res
            .status(400)
            .json({ message: "Username or Password cannot be empty" });
        }

        const user = await User.findOne({ username: data.username });
        if (!user) {
          return res
            .status(401)
            .json({ message: "wrong username or password" });
        }

        const passwordOk = await bcrypt.compare(data.password, user.password);
        if (!passwordOk) {
          return res
            .status(401)
            .json({ message: "wrong username or password" });
        }

        const firebaseToken = await getAuth().createCustomToken(
          String(user._id),
        );

        const token = jwt.sign(
          { userId: user._id, username: user.username },
          process.env.JWT_SECRET,
          {
            expiresIn: "2h",
          },
        );

        return res.json({
          message: "Login successful",
          token,
          firebaseToken,
          user: {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            email: user.email,
          },
        });

      case "insert": {
        if (
          !data.firstName ||
          !data.lastName ||
          !data.email ||
          !data.username ||
          !data.password
        ) {
          return res.status(400).json({
            message:
              "firstName, lastName, email, username, password are required fields",
          });
        }

        const firstName = String(data.firstName).trim();
        const lastName = String(data.lastName).trim();
        const newEmail = String(data.email).trim();
        const username = String(data.username).trim();

        if (firstName.length < 1 || firstName.length > 40) {
          return res
            .status(400)
            .json({ message: "first name must be 1-40 characters" });
        }

        if (lastName.length < 1 || lastName.length > 40) {
          return res
            .status(400)
            .json({ message: "last name must be 1-40 characters" });
        }

        if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) {
          return res.status(400).json({
            message:
              "username must be 3-20 characters, letters numbers and underscores only",
          });
        }

        if (
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail) ||
          newEmail.length > 254
        ) {
          return res.status(400).json({ message: "invalid email address" });
        }

        if (typeof data.password !== "string" || data.password.length < 6) {
          return res
            .status(400)
            .json({ message: "password must be at least 6 characters" });
        }

        const safeUsername = username.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const exists = await User.findOne({
          username: { $regex: "^" + safeUsername + "$", $options: "i" },
        });
        if (exists) {
          return res.status(409).json({ message: "Username Taken" });
        }

        const safeNewEmail = newEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const emailExists = await User.findOne({
          email: { $regex: "^" + safeNewEmail + "$", $options: "i" },
        });
        if (emailExists) {
          return res.status(409).json({ message: "email already taken" });
        }

        const newUser = new User({
          firstName,
          lastName,
          email: newEmail,
          username,
          password: await bcrypt.hash(data.password, saltRounds),
        });
        await newUser.save();

        return res.json({
          message: "user inserted successfuly",
          user: {
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            email: newUser.email,
            username: newUser.username,
          },
        });
      }

      case "select": {
        const caller = await checkIfLoggedIn(req, res);
        if (!caller) {
          return;
        }

        return res.json({
          message: "User fetched",
          user: await User.findById(caller._id).select("-password"),
        });
      }

      case "search": {
        const caller = await checkIfLoggedIn(req, res);
        if (!caller) {
          return;
        }

        const term = (data.term || "").trim();
        if (!term) {
          return res.json({ message: "Users fetched", users: [] });
        }

        const safeTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const users = await User.find({
          username: { $regex: "^" + safeTerm, $options: "i" },
          _id: { $ne: caller._id },
        })
          .select("username")
          .limit(8);

        return res.json({ message: "Users fetched", users });
      }

      case "update": {
        const caller = await checkIfLoggedIn(req, res);
        if (!caller) {
          return;
        }

        const nameOk = (value) =>
          typeof value === "string" &&
          value.trim().length >= 1 &&
          value.trim().length <= 40;

        const email =
          data.email === undefined ? undefined : String(data.email).trim();
        if (
          email !== undefined &&
          (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)
        ) {
          return res.status(400).json({ message: "invalid email address" });
        }

        const wantsEmail =
          email !== undefined &&
          email.toLowerCase() !== caller.email.toLowerCase();
        const wantsPassword =
          data.password !== undefined && data.password !== "";

        if (wantsEmail || wantsPassword) {
          if (!data.currentPassword) {
            return res.status(400).json({
              message: "current password is required to change email or password",
            });
          }

          const currentOk = await bcrypt.compare(
            data.currentPassword,
            caller.password,
          );
          if (!currentOk) {
            return res
              .status(401)
              .json({ message: "current password is incorrect" });
          }
        }

        const updates = {};

        if (data.firstName !== undefined) {
          if (!nameOk(data.firstName)) {
            return res
              .status(400)
              .json({ message: "first name must be 1-40 characters" });
          }
          updates.firstName = data.firstName.trim();
        }

        if (data.lastName !== undefined) {
          if (!nameOk(data.lastName)) {
            return res
              .status(400)
              .json({ message: "last name must be 1-40 characters" });
          }
          updates.lastName = data.lastName.trim();
        }

        if (email !== undefined) {
          if (wantsEmail) {
            const safeEmail = email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const emailTaken = await User.findOne({
              email: { $regex: "^" + safeEmail + "$", $options: "i" },
              _id: { $ne: caller._id },
            });
            if (emailTaken) {
              return res.status(409).json({ message: "email already taken" });
            }
          }
          updates.email = email;
        }

        if (wantsPassword) {
          if (typeof data.password !== "string" || data.password.length < 6) {
            return res
              .status(400)
              .json({ message: "password must be at least 6 characters" });
          }
          updates.password = await bcrypt.hash(data.password, saltRounds);
        }

        if (Object.keys(updates).length === 0) {
          return res.status(400).json({ message: "nothing to update" });
        }

        const updateUser = await User.findByIdAndUpdate(caller._id, updates, {
          new: true,
        }).select("-password");

        return res.json({ message: "User Updated", user: updateUser });
      }

      case "delete": {
        const caller = await checkIfLoggedIn(req, res);
        if (!caller) {
          return;
        }

        await User.findByIdAndDelete(caller._id);

        return res.json({ message: "user deleted" });
      }

      default:
        return res.status(400).json({ message: "unknown command" });
    }
  } catch (err) {
    console.log(err);

    if (err.code === 11000) {
      return res
        .status(409)
        .json({ message: "username or email already taken" });
    }

    return res.status(500).json({ message: "server error" });
  }
});

app.post("/api/groups", async (req, res) => {
  const { command, data } = req.body;

  const caller = await checkIfLoggedIn(req, res);
  if (!caller) {
    return;
  }

  try {
    switch (command) {
      case "insert": {
        if (!data.name) {
          return res.status(400).json({ message: "name is a required field" });
        }

        const existingGroup = await Group.findOne({ name: data.name });
        if (existingGroup) {
          return res.status(409).json({
            message: "A group with this name already exists: " + data.name,
          });
        }

        const newGroup = new Group({
          name: data.name,
          description: data.description || "",
          admins: [caller._id],
          members: [caller._id],
          isPrivate: data.isPrivate || false,
          icon: data.icon || "",
        });
        await newGroup.save();

        return res.json({
          message: "group created successfuly",
          group: newGroup,
        });
      }
      case "select": {
        const isMember = (group) =>
          group.members.some((id) => id.equals(caller._id));

        const censor = (group) => ({
          _id: group._id,
          name: group.name,
          description: group.description,
          createdAt: group.createdAt,
          isPrivate: group.isPrivate,
          icon: group.icon,
        });

        if (data.name) {
          const foundGroup = await Group.findOne({ name: data.name })
            .populate("pendingRequests", "username")
            .populate("members", "username")
            .populate("admins", "username");
          if (!foundGroup) {
            return res.status(404).json({ message: "group not found" });
          }

          if (foundGroup.isPrivate && !isMember(foundGroup)) {
            const censored = censor(foundGroup);
            censored.requested = foundGroup.pendingRequests.some((p) =>
              p._id.equals(caller._id),
            );
            return res.json({
              message: "Groups fetched but a group is private",
              groups: [censored],
            });
          }

          return res.json({ message: "Groups fetched", groups: [foundGroup] });
        }

        const allGroups = await Group.find({});

        return res.json({
          message: "Groups fetched",
          groups: allGroups.map((group) =>
            group.isPrivate && !isMember(group) ? censor(group) : group,
          ),
        });
      }
      case "update": {
        if (!data.name) {
          return res
            .status(400)
            .json({ message: "name is required to identify the group" });
        }

        const foundGroup = await Group.findOne({ name: data.name });
        if (!foundGroup) {
          return res
            .status(404)
            .json({ message: "group name not found: " + data.name });
        }

        const isAdmin = foundGroup.admins.some((id) => id.equals(caller._id));
        if (!isAdmin) {
          return res
            .status(403)
            .json({ message: "user doesnt have permissions to edit group" });
        }

        if (data.newName && data.newName !== foundGroup.name) {
          const nameTaken = await Group.findOne({ name: data.newName });
          if (nameTaken) {
            return res.status(409).json({
              message: "A group with this name already exists: " + data.newName,
            });
          }
        }

        const updates = {
          name: data.newName || foundGroup.name,
          description:
            data.description !== undefined
              ? data.description
              : foundGroup.description,
          isPrivate:
            data.isPrivate !== undefined
              ? data.isPrivate
              : foundGroup.isPrivate,
          icon: data.icon !== undefined ? data.icon : foundGroup.icon,
        };

        const editedGroup = await Group.findByIdAndUpdate(
          foundGroup._id,
          updates,
          { new: true },
        );

        return res.json({ message: "group updated", group: editedGroup });
      }

      case "join": {
        if (!data.name) {
          return res.status(400).json({ message: "name is a required field" });
        }

        const group = await Group.findOne({ name: data.name });
        if (!group) {
          return res.status(404).json({ message: "group not found" });
        }

        if (group.members.some((id) => id.equals(caller._id))) {
          return res.status(409).json({ message: "already a member" });
        }

        if (!group.isPrivate) {
          group.members.push(caller._id);
          await group.save();
          return res.json({ message: "joined group", group });
        }

        if (group.pendingRequests.some((id) => id.equals(caller._id))) {
          return res
            .status(409)
            .json({ message: "join request already pending" });
        }

        group.pendingRequests.push(caller._id);
        await group.save();
        return res.json({
          message: "join request sent, waiting for admin approval",
        });
      }

      case "leave": {
        if (!data.name) {
          return res.status(400).json({ message: "name is a required field" });
        }

        const group = await Group.findOne({ name: data.name });
        if (!group) {
          return res.status(404).json({ message: "group not found" });
        }

        group.members = group.members.filter((id) => !id.equals(caller._id));
        group.admins = group.admins.filter((id) => !id.equals(caller._id));

        if (group.admins.length === 0) {
          const groupPosts = await Post.find({ group: group._id }).select("_id");
          await Comment.deleteMany({
            post: { $in: groupPosts.map((p) => p._id) },
          });
          await Post.deleteMany({ group: group._id });
          await Group.findByIdAndDelete(group._id);
          return res.json({
            message: "left group and deleted it (no admins left)",
          });
        }

        await group.save();
        return res.json({ message: "left group" });
      }

      case "approve": {
        if (!data.name || !data.username) {
          return res
            .status(400)
            .json({ message: "name and username are required fields" });
        }

        const group = await Group.findOne({ name: data.name });
        if (!group) {
          return res.status(404).json({ message: "group not found" });
        }

        if (!group.admins.some((id) => id.equals(caller._id))) {
          return res
            .status(403)
            .json({ message: "only admins can approve join requests" });
        }

        const target = await User.findOne({ username: data.username });
        if (!target) {
          return res.status(404).json({ message: "user not found" });
        }

        if (!group.pendingRequests.some((id) => id.equals(target._id))) {
          return res
            .status(404)
            .json({ message: "no pending request for this user" });
        }

        group.pendingRequests = group.pendingRequests.filter(
          (id) => !id.equals(target._id),
        );
        if (!group.members.some((id) => id.equals(target._id))) {
          group.members.push(target._id);
        }
        await group.save();
        return res.json({ message: "join request approved", group });
      }

      case "reject": {
        if (!data.name || !data.username) {
          return res
            .status(400)
            .json({ message: "name and username are required fields" });
        }

        const group = await Group.findOne({ name: data.name });
        if (!group) {
          return res.status(404).json({ message: "group not found" });
        }

        if (!group.admins.some((id) => id.equals(caller._id))) {
          return res
            .status(403)
            .json({ message: "only admins can reject join requests" });
        }

        const target = await User.findOne({ username: data.username });
        if (!target) {
          return res.status(404).json({ message: "user not found" });
        }

        group.pendingRequests = group.pendingRequests.filter(
          (id) => !id.equals(target._id),
        );
        await group.save();
        return res.json({ message: "join request rejected" });
      }

      case "kick": {
        if (!data.name || !data.username) {
          return res
            .status(400)
            .json({ message: "name and username are required fields" });
        }

        const group = await Group.findOne({ name: data.name });
        if (!group) {
          return res.status(404).json({ message: "group not found" });
        }

        if (!group.admins.some((id) => id.equals(caller._id))) {
          return res
            .status(403)
            .json({ message: "only admins can kick members" });
        }

        const target = await User.findOne({ username: data.username });
        if (!target) {
          return res.status(404).json({ message: "user not found" });
        }
        if (target._id.equals(caller._id)) {
          return res
            .status(400)
            .json({ message: "you cannot kick yourself" });
        }

        group.members = group.members.filter((id) => !id.equals(target._id));
        group.admins = group.admins.filter((id) => !id.equals(target._id));
        await group.save();

        return res.json({ message: "member kicked" });
      }

      case "delete": {
        if (!data.name) {
          return res.status(400).json({ message: "name is a required field" });
        }

        const group = await Group.findOne({ name: data.name });
        if (!group) {
          return res.status(404).json({ message: "group not found" });
        }

        if (!group.admins.some((id) => id.equals(caller._id))) {
          return res
            .status(403)
            .json({ message: "only admins can delete the group" });
        }

        const deletedPosts = await Post.find({ group: group._id }).select("_id");
        await Comment.deleteMany({
          post: { $in: deletedPosts.map((p) => p._id) },
        });
        await Post.deleteMany({ group: group._id });
        await Group.findByIdAndDelete(group._id);
        return res.json({ message: "group deleted" });
      }

      default:
        return res.status(400).json({ message: "unknown command" });
    }
  } catch (err) {
    console.log(err);

    return res
      .status(500)
      .json({ message: "Unexpected server error", error: err });
  }
});

app.post("/api/posts", async (req, res) => {
  const { command, data } = req.body;

  const caller = await checkIfLoggedIn(req, res);
  if (!caller) {
    return;
  }

  try {
    switch (command) {
      case "insert": {
        if (!data.title || !data.group) {
          return res.status(400).json({
            message: "Title and group are required fields",
          });
        }
        if (!data.content && !data.media) {
          return res.status(400).json({
            message: "A post must include text or media",
          });
        }

        const group = await Group.findOne({ name: data.group });
        if (!group) {
          return res
            .status(404)
            .json({ message: "group not found: " + data.group });
        }

        if (!group.members.some((id) => id.equals(caller._id))) {
          return res
            .status(403)
            .json({ message: "only group members can post" });
        }

        const newPost = new Post({
          title: data.title,
          content: data.content || "",
          author: caller._id,
          group: group._id,
          media: data.media || "",
          mediaType: data.mediaType || "",
          upvoters: [caller._id],
        });
        await newPost.save();

        return res.json({ message: "post created successfuly", post: newPost });
      }

      case "select": {
        const shape = (p) => {
          const obj = p.toObject();
          obj.score = (p.upvoters || []).length - (p.downvoters || []).length;
          obj.myVote = (p.upvoters || []).some((id) => id.equals(caller._id))
            ? 1
            : (p.downvoters || []).some((id) => id.equals(caller._id))
              ? -1
              : 0;
          delete obj.upvoters;
          delete obj.downvoters;
          return obj;
        };

        const memberGroups = await Group.find({ members: caller._id }).select(
          "_id",
        );
        const memberGroupIds = memberGroups.map((group) => group._id);

        const visibleGroups = await Group.find({
          $or: [{ isPrivate: false }, { _id: { $in: memberGroupIds } }],
        }).select("_id");
        const visibleGroupIds = visibleGroups.map((group) => group._id);

        if (data.postId) {
          const one = await Post.findById(data.postId)
            .populate("author", "username firstName lastName")
            .populate("group", "name icon");
          if (!one) {
            return res.status(404).json({ message: "post not found" });
          }
          if (!visibleGroupIds.some((id) => id.equals(one.group._id))) {
            return res.status(403).json({ message: "post not accessible" });
          }
          return res.json({ message: "Post fetched", post: shape(one) });
        }

        if (data.feed) {
          const FEED_MAX = 50;
          const feedPosts = await Post.find({
            $or: [
              { author: caller._id },
              { group: { $in: memberGroupIds } },
              { author: { $in: caller.friends } },
            ],
          })
            .populate("author", "username firstName lastName")
            .populate("group", "name icon")
            .sort({ createdAt: -1 })
            .limit(FEED_MAX);

          return res.json({
            message: "Feed fetched",
            posts: feedPosts.map(shape),
          });
        }

        const filter = {};

        if (data.mine) {
          filter.author = caller._id;
        } else if (data.author) {
          const authorUser = await User.findOne({ username: data.author });
          if (!authorUser) {
            return res.json({ message: "Posts fetched", posts: [] });
          }
          filter.author = authorUser._id;
        }

        if (data.group) {
          const group = await Group.findOne({ name: data.group });
          if (!group) {
            return res
              .status(404)
              .json({ message: "group not found: " + data.group });
          }
          if (
            group.isPrivate &&
            !memberGroupIds.some((id) => id.equals(group._id))
          ) {
            return res.json({ message: "Posts fetched", posts: [] });
          }
          filter.group = group._id;
        }

        if (data.keyword) {
          filter.$or = [
            { title: { $regex: data.keyword, $options: "i" } },
            { content: { $regex: data.keyword, $options: "i" } },
          ];
        }

        if (data.fromDate || data.toDate) {
          filter.createdAt = {};
          if (data.fromDate) filter.createdAt.$gte = new Date(data.fromDate);
          if (data.toDate) filter.createdAt.$lte = new Date(data.toDate);
        }

        const posts = await Post.find(filter)
          .populate("author", "username firstName lastName")
          .populate("group", "name icon isPrivate")
          .sort({ createdAt: -1 })
          .limit(50);

        const commentCounts = await Comment.aggregate([
          { $match: { post: { $in: posts.map((p) => p._id) } } },
          { $group: { _id: "$post", n: { $sum: 1 } } },
        ]);
        const commentCountMap = new Map(
          commentCounts.map((c) => [c._id.toString(), c.n]),
        );

        const memberSet = new Set(memberGroupIds.map((id) => id.toString()));
        const shapeSearch = (p) => {
          const obj = shape(p);
          obj.commentCount = commentCountMap.get(p._id.toString()) || 0;
          const g = obj.group;
          if (g?.isPrivate && !memberSet.has(g._id?.toString())) {
            obj.locked = true;
            obj.title = "";
            obj.content = "";
            obj.media = "";
            obj.mediaType = "";
          }
          return obj;
        };

        return res.json({
          message: "Posts fetched",
          posts: posts.map(shapeSearch),
        });
      }

      case "update": {
        if (!data.postId) {
          return res
            .status(400)
            .json({ message: "postId is a required field" });
        }

        const post = await Post.findById(data.postId);
        if (!post) {
          return res.status(404).json({ message: "post not found" });
        }

        if (!post.author.equals(caller._id)) {
          return res
            .status(403)
            .json({ message: "you can only edit your own posts" });
        }

        post.title = data.title || post.title;
        post.content = data.content || post.content;
        await post.save();

        return res.json({ message: "post updated", post });
      }

      case "delete": {
        if (!data.postId) {
          return res
            .status(400)
            .json({ message: "postId is a required field" });
        }

        const post = await Post.findById(data.postId);
        if (!post) {
          return res.status(404).json({ message: "post not found" });
        }

        const group = await Group.findById(post.group);
        const isAuthor = post.author.equals(caller._id);
        const isGroupAdmin =
          group && group.admins.some((id) => id.equals(caller._id));

        if (!isAuthor && !isGroupAdmin) {
          return res
            .status(403)
            .json({ message: "you can only delete your own posts" });
        }

        await Post.findByIdAndDelete(post._id);

        return res.json({ message: "post deleted" });
      }

      case "vote": {
        if (!data.postId) {
          return res
            .status(400)
            .json({ message: "postId is a required field" });
        }

        const post = await Post.findById(data.postId);
        if (!post) {
          return res.status(404).json({ message: "post not found" });
        }

        post.upvoters = post.upvoters.filter((id) => !id.equals(caller._id));
        post.downvoters = post.downvoters.filter(
          (id) => !id.equals(caller._id),
        );
        if (data.value === 1) {
          post.upvoters.push(caller._id);
        } else if (data.value === -1) {
          post.downvoters.push(caller._id);
        }
        await post.save();

        return res.json({
          message: "vote registered",
          score: post.upvoters.length - post.downvoters.length,
        });
      }

      default:
        return res.status(400).json({ message: "unknown command" });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "server error" });
  }
});

app.post("/api/comments", async (req, res) => {
  const { command, data } = req.body;

  const caller = await checkIfLoggedIn(req, res);
  if (!caller) {
    return;
  }

  const shapeComment = (c) => {
    const obj = c.toObject();
    obj.score = (c.upvoters || []).length - (c.downvoters || []).length;
    obj.myVote = (c.upvoters || []).some((id) => id.equals(caller._id))
      ? 1
      : (c.downvoters || []).some((id) => id.equals(caller._id))
        ? -1
        : 0;
    delete obj.upvoters;
    delete obj.downvoters;
    return obj;
  };

  try {
    switch (command) {
      case "insert": {
        if (!data.postId || !data.content) {
          return res
            .status(400)
            .json({ message: "postId and content are required fields" });
        }

        const post = await Post.findById(data.postId);
        if (!post) {
          return res.status(404).json({ message: "post not found" });
        }

        const group = await Group.findById(post.group);
        const canSee =
          group &&
          (!group.isPrivate ||
            group.members.some((id) => id.equals(caller._id)));
        if (!canSee) {
          return res.status(403).json({ message: "post not accessible" });
        }

        let parent = null;
        if (data.parentId) {
          const parentComment = await Comment.findById(data.parentId);
          if (!parentComment || !parentComment.post.equals(post._id)) {
            return res.status(400).json({ message: "invalid parent comment" });
          }
          parent = parentComment._id;
        }

        const newComment = new Comment({
          post: post._id,
          author: caller._id,
          content: data.content,
          parent,
          upvoters: [caller._id],
        });
        await newComment.save();
        await newComment.populate("author", "username firstName lastName");

        return res.json({
          message: "comment added",
          comment: shapeComment(newComment),
        });
      }

      case "select": {
        if (!data.postId) {
          return res
            .status(400)
            .json({ message: "postId is a required field" });
        }

        const comments = await Comment.find({ post: data.postId })
          .populate("author", "username firstName lastName")
          .sort({ createdAt: 1 });

        return res.json({
          message: "comments fetched",
          comments: comments.map(shapeComment),
        });
      }

      case "update": {
        if (!data.commentId || !data.content) {
          return res
            .status(400)
            .json({ message: "commentId and content are required fields" });
        }

        const comment = await Comment.findById(data.commentId);
        if (!comment) {
          return res.status(404).json({ message: "comment not found" });
        }

        if (!comment.author.equals(caller._id)) {
          return res
            .status(403)
            .json({ message: "you can only edit your own comments" });
        }

        comment.content = data.content;
        await comment.save();
        await comment.populate("author", "username firstName lastName");

        return res.json({
          message: "comment updated",
          comment: shapeComment(comment),
        });
      }

      case "delete": {
        if (!data.commentId) {
          return res
            .status(400)
            .json({ message: "commentId is a required field" });
        }

        const comment = await Comment.findById(data.commentId);
        if (!comment) {
          return res.status(404).json({ message: "comment not found" });
        }

        if (!comment.author.equals(caller._id)) {
          return res
            .status(403)
            .json({ message: "you can only delete your own comments" });
        }

        await Comment.findByIdAndDelete(comment._id);

        return res.json({ message: "comment deleted" });
      }

      case "vote": {
        if (!data.commentId) {
          return res
            .status(400)
            .json({ message: "commentId is a required field" });
        }

        const comment = await Comment.findById(data.commentId);
        if (!comment) {
          return res.status(404).json({ message: "comment not found" });
        }

        comment.upvoters = comment.upvoters.filter(
          (id) => !id.equals(caller._id),
        );
        comment.downvoters = comment.downvoters.filter(
          (id) => !id.equals(caller._id),
        );
        if (data.value === 1) {
          comment.upvoters.push(caller._id);
        } else if (data.value === -1) {
          comment.downvoters.push(caller._id);
        }
        await comment.save();

        return res.json({
          message: "vote registered",
          score: comment.upvoters.length - comment.downvoters.length,
        });
      }

      default:
        return res.status(400).json({ message: "unknown command" });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "server error" });
  }
});

app.post("/api/chat", async (req, res) => {
  const { command, data } = req.body;
  const caller = await checkIfLoggedIn(req, res);
  if (!caller) return;

  try {
    switch (command) {
      case "start": {
        const other = await User.findOne({ username: data.username });
        if (!other) return res.status(404).json({ message: "user not found" });

        if (other._id.equals(caller._id)) {
          return res
            .status(400)
            .json({ message: "you cannot start a chat with yourself" });
        }

        let convo = await Conversation.findOne({
          isGroup: false,
          participants: { $all: [caller._id, other._id], $size: 2 },
        });

        if (!convo) {
          convo = await Conversation.create({
            participants: [caller._id, other._id],
          });
        }
        await convo.populate("participants", "username firstName lastName");
        return res.json({ conversation: convo });
      }

      case "startGroup": {
        if (!data.name?.trim()) {
          return res.status(400).json({ message: "group name is required" });
        }
        if (!Array.isArray(data.usernames) || data.usernames.length === 0) {
          return res.status(400).json({ message: "pick at least one member" });
        }

        const others = await User.find({ username: { $in: data.usernames } });
        if (others.length !== data.usernames.length) {
          return res.status(404).json({ message: "some users were not found" });
        }

        const participantIds = [caller._id];
        others.forEach((one) => {
          if (!one._id.equals(caller._id)) participantIds.push(one._id);
        });

        const groupConvo = await Conversation.create({
          participants: participantIds,
          isGroup: true,
          name: data.name.trim(),
          admin: caller._id,
        });
        await groupConvo.populate(
          "participants",
          "username firstName lastName",
        );
        return res.json({ conversation: groupConvo });
      }

      case "addMember": {
        if (!data.conversationId || !data.username) {
          return res
            .status(400)
            .json({ message: "conversationId and username are required" });
        }

        const groupConvo = await Conversation.findById(data.conversationId);
        if (!groupConvo || !groupConvo.isGroup) {
          return res.status(404).json({ message: "group chat not found" });
        }
        if (!groupConvo.admin || !groupConvo.admin.equals(caller._id)) {
          return res
            .status(403)
            .json({ message: "only the admin can add members" });
        }

        const target = await User.findOne({ username: data.username });
        if (!target) return res.status(404).json({ message: "user not found" });

        if (groupConvo.participants.some((id) => id.equals(target._id))) {
          return res.status(400).json({ message: "user is already a member" });
        }

        groupConvo.participants.push(target._id);
        await groupConvo.save();
        return res.json({ message: "member added" });
      }

      case "pin": {
        const target = await Conversation.findById(data.conversationId);
        if (
          !target ||
          !target.participants.some((id) => id.equals(caller._id))
        ) {
          return res.status(403).json({ message: "not allowed" });
        }

        if (target.pinnedBy.some((id) => id.equals(caller._id))) {
          return res.json({ message: "already pinned" });
        }

        const pinnedCount = await Conversation.countDocuments({
          participants: caller._id,
          pinnedBy: caller._id,
        });
        if (pinnedCount >= 3) {
          return res
            .status(400)
            .json({ message: "you can pin up to 3 chats only" });
        }

        target.pinnedBy.push(caller._id);
        await target.save();
        return res.json({ message: "chat pinned" });
      }

      case "unpin": {
        const target = await Conversation.findById(data.conversationId);
        if (
          !target ||
          !target.participants.some((id) => id.equals(caller._id))
        ) {
          return res.status(403).json({ message: "not allowed" });
        }

        target.pinnedBy = target.pinnedBy.filter(
          (id) => !id.equals(caller._id),
        );
        await target.save();
        return res.json({ message: "chat unpinned" });
      }

      case "leave": {
        const target = await Conversation.findById(data.conversationId);
        if (
          !target ||
          !target.participants.some((id) => id.equals(caller._id))
        ) {
          return res.status(403).json({ message: "not allowed" });
        }
        if (!target.isGroup) {
          return res
            .status(400)
            .json({ message: "you can only leave group chats" });
        }
        if (target.admin?.equals(caller._id)) {
          return res
            .status(400)
            .json({ message: "the admin must delete the group instead" });
        }

        target.participants = target.participants.filter(
          (id) => !id.equals(caller._id),
        );
        target.pinnedBy = target.pinnedBy.filter(
          (id) => !id.equals(caller._id),
        );
        await target.save();
        return res.json({ message: "left the group" });
      }

      case "delete": {
        const target = await Conversation.findById(data.conversationId);
        if (
          !target ||
          !target.participants.some((id) => id.equals(caller._id))
        ) {
          return res.status(403).json({ message: "not allowed" });
        }
        if (target.isGroup && !target.admin?.equals(caller._id)) {
          return res
            .status(403)
            .json({ message: "only the admin can delete this group chat" });
        }

        await Message.deleteMany({ conversation: target._id });
        await target.deleteOne();
        return res.json({ message: "chat deleted" });
      }

      case "conversations": {
        const convoList = await Conversation.find({ participants: caller._id })
          .populate("participants", "username firstName lastName")
          .sort({ lastMessageAt: -1 });

        const previews = await Message.aggregate([
          { $match: { conversation: { $in: convoList.map((c) => c._id) } } },
          { $sort: { createdAt: -1 } },
          {
            $group: {
              _id: "$conversation",
              content: { $first: "$content" },
              sender: { $first: "$sender" },
              createdAt: { $first: "$createdAt" },
            },
          },
        ]);
        const previewMap = new Map(
          previews.map((one) => [one._id.toString(), one]),
        );

        const shaped = convoList.map((convo) => {
          const obj = convo.toObject();
          obj.pinned = convo.pinnedBy.some((id) => id.equals(caller._id));
          obj.isAdmin = !!convo.admin?.equals(caller._id);
          obj.lastMessage = previewMap.get(convo._id.toString()) || null;
          delete obj.pinnedBy;
          return obj;
        });

        shaped.sort((a, b) => {
          if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
          return new Date(b.lastMessageAt) - new Date(a.lastMessageAt);
        });

        return res.json({ conversations: shaped });
      }

      case "messages": {
        const convo = await Conversation.findById(data.conversationId);
        if (!convo || !convo.participants.some((id) => id.equals(caller._id))) {
          return res.status(403).json({ message: "not allowed" });
        }

        const messages = await Message.find({ conversation: convo._id })
          .populate("sender", "username firstName lastName")
          .sort({ createdAt: -1 })
          .limit(100);
        return res.json({ messages });
      }

      default: {
        return res.status(400).json({ message: "unknown command" });
      }
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server Error" });
  }
});

const dayKey = (date) => date.toISOString().slice(0, 10);

const startOfDayUTC = (date) => {
  const copy = new Date(date);
  copy.setUTCHours(0, 0, 0, 0);
  return copy;
};

const startOfWeekUTC = (date) => {
  const copy = startOfDayUTC(date);
  copy.setUTCDate(copy.getUTCDate() - copy.getUTCDay());
  return copy;
};

const countByDay = (rows) => {
  const counts = new Map();
  rows.forEach((row) => counts.set(row._id, (counts.get(row._id) || 0) + row.n));
  return counts;
};

app.post("/api/stats", async (req, res) => {
  const { command, data } = req.body;
  const caller = await checkIfLoggedIn(req, res);
  if (!caller) return;

  try {
    switch (command) {
      case "contributions": {
        const target = data.username
          ? await User.findOne({ username: data.username })
          : caller;
        if (!target) {
          return res.status(404).json({ message: "user not found" });
        }

        const weeks = Math.min(Number(data.weeks) || 53, 53);
        const today = startOfDayUTC(new Date());
        const since = startOfWeekUTC(today);
        since.setUTCDate(since.getUTCDate() - (weeks - 1) * 7);

        const memberGroups = await Group.find({ members: caller._id }).select(
          "_id",
        );
        const visibleGroups = await Group.find({
          $or: [
            { isPrivate: false },
            { _id: { $in: memberGroups.map((one) => one._id) } },
          ],
        }).select("_id");
        const visibleGroupIds = visibleGroups.map((one) => one._id);

        const postDays = await Post.aggregate([
          {
            $match: {
              author: target._id,
              group: { $in: visibleGroupIds },
              createdAt: { $gte: since },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
              },
              n: { $sum: 1 },
            },
          },
        ]);

        const commentDays = await Comment.aggregate([
          { $match: { author: target._id, createdAt: { $gte: since } } },
          {
            $lookup: {
              from: "posts",
              localField: "post",
              foreignField: "_id",
              as: "parentPost",
            },
          },
          { $unwind: "$parentPost" },
          { $match: { "parentPost.group": { $in: visibleGroupIds } } },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
              },
              n: { $sum: 1 },
            },
          },
        ]);

        const counts = countByDay([...postDays, ...commentDays]);

        const days = [];
        for (
          const cursor = new Date(since);
          cursor <= today;
          cursor.setUTCDate(cursor.getUTCDate() + 1)
        ) {
          const key = dayKey(cursor);
          days.push({ date: key, count: counts.get(key) || 0 });
        }

        return res.json({
          message: "Contributions fetched",
          username: target.username,
          total: days.reduce((sum, one) => sum + one.count, 0),
          days,
        });
      }

      case "groupActivity": {
        if (!data.name) {
          return res.status(400).json({ message: "name is a required field" });
        }

        const group = await Group.findOne({ name: data.name });
        if (!group) {
          return res.status(404).json({ message: "group not found" });
        }
        if (
          group.isPrivate &&
          !group.members.some((id) => id.equals(caller._id))
        ) {
          return res.status(403).json({ message: "group is private" });
        }

        const weeks = Math.min(Number(data.weeks) || 12, 52);
        const firstWeek = startOfWeekUTC(new Date());
        firstWeek.setUTCDate(firstWeek.getUTCDate() - (weeks - 1) * 7);

        const postDays = await Post.aggregate([
          { $match: { group: group._id, createdAt: { $gte: firstWeek } } },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
              },
              n: { $sum: 1 },
            },
          },
        ]);

        const buckets = [];
        for (let index = 0; index < weeks; index += 1) {
          const weekStart = new Date(firstWeek);
          weekStart.setUTCDate(weekStart.getUTCDate() + index * 7);
          buckets.push({ weekStart: dayKey(weekStart), count: 0 });
        }

        const dayMs = 24 * 60 * 60 * 1000;
        countByDay(postDays).forEach((count, key) => {
          const offset = Math.floor(
            (new Date(key + "T00:00:00.000Z") - firstWeek) / dayMs / 7,
          );
          if (offset >= 0 && offset < buckets.length) {
            buckets[offset].count += count;
          }
        });

        return res.json({
          message: "Group activity fetched",
          group: group.name,
          total: buckets.reduce((sum, one) => sum + one.count, 0),
          weeks: buckets,
        });
      }

      default: {
        return res.status(400).json({ message: "unknown command" });
      }
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server Error" });
  }
});

const httpServer = http.createServer(app);
initChatToken(httpServer, { Conversation, Message });

const PORT = process.env.SERVER_PORT;
httpServer.listen(PORT, () => console.log("server running on port:" + PORT));
