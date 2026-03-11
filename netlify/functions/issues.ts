import type { Context } from "@netlify/functions";
import { STORES, getAll, put, jsonResponse, optionsResponse } from "./utils/db";

export default async (req: Request, context: Context) => {
  if (req.method === "OPTIONS") return optionsResponse();

  if (req.method === "GET") {
    const issues = await getAll(STORES.issues);
    return jsonResponse(issues);
  }

  if (req.method === "POST") {
    const issue = await req.json();
    await put(STORES.issues, issue.id, issue);
    return jsonResponse({ success: true });
  }

  return jsonResponse({ error: "Method not allowed" }, 405);
};
