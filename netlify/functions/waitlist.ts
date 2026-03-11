import type { Context } from "@netlify/functions";
import { STORES, getAll, put, jsonResponse, optionsResponse } from "./utils/db";

export default async (req: Request, context: Context) => {
  if (req.method === "OPTIONS") return optionsResponse();

  if (req.method === "GET") {
    const waitlist = await getAll(STORES.waitlist);
    return jsonResponse(waitlist);
  }

  if (req.method === "POST") {
    const entry = await req.json();
    await put(STORES.waitlist, entry.id, entry);
    return jsonResponse({ success: true });
  }

  return jsonResponse({ error: "Method not allowed" }, 405);
};
