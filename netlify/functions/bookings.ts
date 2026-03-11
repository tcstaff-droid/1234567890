import type { Context } from "@netlify/functions";
import { STORES, getAll, put, jsonResponse, optionsResponse } from "./utils/db";

export default async (req: Request, context: Context) => {
  if (req.method === "OPTIONS") return optionsResponse();

  if (req.method === "GET") {
    const bookings = await getAll(STORES.bookings);
    const mapped = bookings.map((b: any) => ({
      ...b,
      approvals: b.approvals || [],
    }));
    return jsonResponse(mapped);
  }

  if (req.method === "POST") {
    const booking = await req.json();
    await put(STORES.bookings, booking.id, {
      ...booking,
      approvals: booking.approvals || [],
    });
    return jsonResponse({ success: true });
  }

  return jsonResponse({ error: "Method not allowed" }, 405);
};
