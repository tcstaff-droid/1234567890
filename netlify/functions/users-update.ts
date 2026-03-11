import type { Context } from "@netlify/functions";
import { STORES, getById, put, jsonResponse, optionsResponse } from "./utils/db";

export default async (req: Request, context: Context) => {
  if (req.method === "OPTIONS") return optionsResponse();

  if (req.method !== "PATCH") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return jsonResponse({ success: false, message: "Missing user ID" }, 400);
  }

  const user = await getById(STORES.users, id);
  if (!user) {
    return jsonResponse({ success: false, message: "User not found" }, 404);
  }

  if (user.username === "admin") {
    return jsonResponse({ success: false, message: "Cannot modify system administrator" }, 403);
  }

  const updates = await req.json();
  const updatedUser = { ...user, ...updates };

  // Convert boolean fields
  if (typeof updatedUser.emailNotifications === "boolean") {
    updatedUser.emailNotifications = updatedUser.emailNotifications;
  }
  if (typeof updatedUser.requiresSetup === "boolean") {
    updatedUser.requiresSetup = updatedUser.requiresSetup;
  }

  await put(STORES.users, id, updatedUser);
  return jsonResponse({ success: true });
};
