import { getStore } from "@netlify/blobs";

// Store names
const STORES = {
  users: "users",
  bookings: "bookings",
  waitlist: "waitlist",
  issues: "issues",
  approvalConfigs: "approval-configs",
};

// Default admin user
const DEFAULT_ADMIN = {
  id: "admin-1",
  username: "admin",
  password: "TCSB123!",
  pin: "1234",
  fullName: "System Administrator",
  email: "admin@thamescity.com",
  phone: "0000000000",
  department: "Management",
  jobTitle: "Admin",
  headOfDepartment: "N/A",
  role: "Admin",
  status: "Active",
  createdAt: new Date().toISOString(),
  emailNotifications: true,
  requiresSetup: false,
};

function getStoreInstance(storeName: string) {
  return getStore(storeName);
}

// Generic helpers
async function getAll(storeName: string): Promise<any[]> {
  const store = getStoreInstance(storeName);
  const { blobs } = await store.list();
  const items = await Promise.all(
    blobs.map(async (blob) => {
      const data = await store.get(blob.key, { type: "json" });
      return data;
    })
  );
  return items.filter(Boolean);
}

async function getById(storeName: string, id: string): Promise<any | null> {
  const store = getStoreInstance(storeName);
  try {
    const data = await store.get(id, { type: "json" });
    return data;
  } catch {
    return null;
  }
}

async function put(storeName: string, id: string, data: any): Promise<void> {
  const store = getStoreInstance(storeName);
  await store.setJSON(id, data);
}

async function remove(storeName: string, id: string): Promise<void> {
  const store = getStoreInstance(storeName);
  await store.delete(id);
}

// Ensure admin exists
async function ensureAdmin(): Promise<void> {
  const admin = await getById(STORES.users, "admin-1");
  if (!admin) {
    await put(STORES.users, "admin-1", DEFAULT_ADMIN);
  }
}

// User-specific helpers
async function getAllUsers(): Promise<any[]> {
  await ensureAdmin();
  const users = await getAll(STORES.users);
  return users;
}

async function getUserByCredentials(
  username: string,
  field: "password" | "pin",
  value: string
): Promise<any | null> {
  await ensureAdmin();
  const users = await getAll(STORES.users);
  return users.find((u) => u.username === username && u[field] === value) || null;
}

// CORS headers for all responses
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
};

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}

function optionsResponse() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export {
  STORES,
  getAll,
  getById,
  put,
  remove,
  getAllUsers,
  getUserByCredentials,
  ensureAdmin,
  corsHeaders,
  jsonResponse,
  optionsResponse,
};
