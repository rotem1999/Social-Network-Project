const UserSchema = {
  username: { type: String, unique: true, required: true, lowercase: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  friends: [String],
};

module.exports = { UserSchema };
