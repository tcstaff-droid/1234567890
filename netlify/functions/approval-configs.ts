import type { Context } from "@netlify/functions";
import { STORES, getAll, put, jsonResponse, optionsResponse } from "./utils/db";

export default async (req: Request, context: Context) => {
  if (req.method === "OPTIONS") return optionsResponse();

  if (req.method === "GET") {
    const configs = await getAll(STORES.approvalConfigs);
    const result: Record<string, any> = {};
    configs.forEach((c: any) => {
      result[c.department] = {
        managerIds: c.managerIds || [],
        logic: c.logic || "any",
      };
    });
    return jsonResponse(result);
  }

  if (req.method === "POST") {
    const { department, config } = await req.json();
    await put(STORES.approvalConfigs, department, {
      department,
      managerIds: config.managerIds,
      logic: config.logic,
    });
    return jsonResponse({ success: true });
  }

  return jsonResponse({ error: "Method not allowed" }, 405);
};
