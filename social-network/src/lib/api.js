const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const USERS_URL = API_URL + "/api/users";
export const GROUPS_URL = API_URL + "/api/groups";
export const POSTS_URL = API_URL + "/api/posts";
export const COMMENTS_URL = API_URL + "/api/comments";
export const CHAT_URL = API_URL + "/api/chat";
export const SOCKET_URL = API_URL;
