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
    return jsonResponse({ success: false, message: "Missing booking ID" }, 400);
  }

  const booking = await getById(STORES.bookings, id);
  if (!booking) {
    return jsonResponse({ success: false, message: "Booking not found" }, 404);
  }

  const { status, rejectionReason, approvals } = await req.json();

  if (status !== undefined) booking.status = status;
  if (rejectionReason !== undefined) booking.rejectionReason = rejectionReason;
  if (approvals !== undefined) booking.approvals = approvals;

  await put(STORES.bookings, id, booking);
  return jsonResponse({ success: true });
};
