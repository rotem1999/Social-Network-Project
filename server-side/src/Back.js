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

const User = mongoose.model("User", userSchema);
const Group = mongoose.model("Group", groupSchema);
const Post = mongoose.model("Post", postSchema);
const Comment = mongoose.model("Comment", commentSchema);

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

      case "insert":
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

        const exists = await User.findOne({ username: data.username });
        if (exists) {
          return res.status(409).json({ message: "Username Taken" });
        }

        const newUser = new User({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          username: data.username,
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

      case "update": {
        const caller = await checkIfLoggedIn(req, res);
        if (!caller) {
          return;
        }

        const updates = {
          firstName: data.firstName || caller.firstName,
          lastName: data.lastName || caller.lastName,
          email: data.email || caller.email,
          password: data.password
            ? await bcrypt.hash(data.password, saltRounds)
            : caller.password,
        };

        if (updates.email !== caller.email) {
          const emailTaken = await User.findOne({ email: updates.email });
          if (emailTaken) {
            return res.status(409).json({ message: "email already taken" });
          }
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
          name: group.name,
          description: group.description,
          createdAt: group.createdAt,
          isPrivate: group.isPrivate,
          icon: group.icon,
        });

        if (data.name) {
          const foundGroup = await Group.findOne({ name: data.name });
          if (!foundGroup) {
            return res.status(404).json({ message: "group not found" });
          }

          if (foundGroup.isPrivate && !isMember(foundGroup)) {
            return res.json({
              message: "Groups fetched but a group is private",
              groups: [censor(foundGroup)],
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

        const filter = { group: { $in: visibleGroupIds } };

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
          filter.group = visibleGroupIds.some((id) => id.equals(group._id))
            ? group._id
            : null;
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
          .populate("group", "name")
          .sort({ createdAt: -1 });

        return res.json({ message: "Posts fetched", posts: posts.map(shape) });
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
            return res
              .status(400)
              .json({ message: "invalid parent comment" });
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

const PORT = process.env.SERVER_PORT;
app.listen(PORT, () => {
  console.log(`server running on port:` + PORT);
});
