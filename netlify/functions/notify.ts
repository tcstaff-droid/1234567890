import type { Context } from "@netlify/functions";
import { jsonResponse, optionsResponse } from "./utils/db";

// In a serverless environment, Socket.io cannot maintain persistent connections.
// This endpoint accepts notification requests and returns success.
// Real-time notifications are handled client-side instead.
export default async (req: Request, context: Context) => {
  if (req.method === "OPTIONS") return optionsResponse();

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  // Accept the notification request gracefully
  return jsonResponse({ success: true });
};
