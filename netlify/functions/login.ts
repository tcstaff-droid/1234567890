import type { Context } from "@netlify/functions";
import { getUserByCredentials, jsonResponse, optionsResponse } from "./utils/db";

export default async (req: Request, context: Context) => {
  if (req.method === "OPTIONS") return optionsResponse();

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const { username, password, pin } = await req.json();
  let user = null;

  if (password) {
    user = await getUserByCredentials(username, "password", password);
  } else if (pin) {
    user = await getUserByCredentials(username, "pin", pin);
  }

  if (user) {
    if (user.status === "Pending") {
      return jsonResponse({ success: false, message: "Account pending approval" }, 403);
    }
    if (user.status === "Rejected") {
      return jsonResponse({ success: false, message: "Account has been rejected" }, 403);
    }

    const userObj = {
      ...user,
      emailNotifications: !!user.emailNotifications,
      requiresSetup: !!user.requiresSetup,
    };
    return jsonResponse({ success: true, user: userObj });
  }

  return jsonResponse({ success: false, message: "Invalid credentials" }, 401);
};
