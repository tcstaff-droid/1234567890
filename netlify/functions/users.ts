import type { Context } from "@netlify/functions";
import { getAllUsers, jsonResponse, optionsResponse } from "./utils/db";

export default async (req: Request, context: Context) => {
  if (req.method === "OPTIONS") return optionsResponse();

  if (req.method !== "GET") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const users = await getAllUsers();
  const filtered = users
    .filter((u: any) => u.username !== "admin")
    .map((u: any) => ({
      ...u,
      emailNotifications: !!u.emailNotifications,
      requiresSetup: !!u.requiresSetup,
    }));

  return jsonResponse(filtered);
};
