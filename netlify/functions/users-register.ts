import type { Context } from "@netlify/functions";
import { STORES, put, jsonResponse, optionsResponse } from "./utils/db";

export default async (req: Request, context: Context) => {
  if (req.method === "OPTIONS") return optionsResponse();

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const userData = await req.json();
    await put(STORES.users, userData.id, {
      ...userData,
      emailNotifications: userData.emailNotifications ? true : false,
    });
    return jsonResponse({ success: true });
  } catch (error: any) {
    return jsonResponse({ success: false, message: error.message }, 400);
  }
};
