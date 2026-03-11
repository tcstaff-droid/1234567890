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
    return jsonResponse({ success: false, message: "Missing issue ID" }, 400);
  }

  const issue = await getById(STORES.issues, id);
  if (!issue) {
    return jsonResponse({ success: false, message: "Issue not found" }, 404);
  }

  const { status } = await req.json();
  issue.status = status;

  await put(STORES.issues, id, issue);
  return jsonResponse({ success: true });
};
