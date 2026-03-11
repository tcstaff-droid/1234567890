import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Database
const db = new Database("thames_city.db");
db.pragma("journal_mode = WAL");

// Create Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    password TEXT,
    pin TEXT,
    fullName TEXT,
    email TEXT,
    phone TEXT,
    department TEXT,
    jobTitle TEXT,
    headOfDepartment TEXT,
    role TEXT,
    status TEXT,
    createdAt TEXT,
    emailNotifications INTEGER,
    requiresSetup INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    userId TEXT,
    userName TEXT,
    userDepartment TEXT,
    facility TEXT,
    date TEXT,
    timeSlot TEXT,
    status TEXT,
    createdAt TEXT,
    termsAcceptedAt TEXT,
    rejectionReason TEXT,
    approvals TEXT,
    FOREIGN KEY(userId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS waitlist (
    id TEXT PRIMARY KEY,
    userId TEXT,
    userName TEXT,
    facility TEXT,
    date TEXT,
    timeSlot TEXT,
    createdAt TEXT,
    FOREIGN KEY(userId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS issues (
    id TEXT PRIMARY KEY,
    facility TEXT,
    description TEXT,
    status TEXT,
    createdAt TEXT,
    reportedBy TEXT,
    FOREIGN KEY(reportedBy) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS approval_configs (
    department TEXT PRIMARY KEY,
    managerIds TEXT,
    logic TEXT
  );
`);

// Seed Admin if not exists
const adminExists = db.prepare("SELECT id FROM users WHERE username = ?").get("admin");
if (!adminExists) {
  db.prepare(`
    INSERT INTO users (id, username, password, pin, fullName, email, phone, department, jobTitle, headOfDepartment, role, status, createdAt, emailNotifications)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    "admin-1",
    "admin",
    "TCSB123!",
    "1234",
    "System Administrator",
    "admin@thamescity.com",
    "0000000000",
    "Management",
    "Admin",
    "N/A",
    "Admin",
    "Active",
    new Date().toISOString(),
    1
  );
} else {
  // Ensure password is correct even if seeded before
  db.prepare("UPDATE users SET password = ? WHERE username = ?").run("TCSB123!", "admin");
}

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  const PORT = 3000;

  // Socket.io logic
  io.on("connection", (socket) => {
    socket.on("join-room", (userId) => {
      socket.join(userId);
    });
  });

  app.use(express.json());

  // API Routes
  
  // Users
  app.get("/api/users", (req, res) => {
    const users = db.prepare("SELECT * FROM users WHERE username != 'admin'").all();
    res.json(users.map((u: any) => ({ ...u, emailNotifications: !!u.emailNotifications, requiresSetup: !!u.requiresSetup })));
  });

  app.post("/api/login", (req, res) => {
    const { username, password, pin } = req.body;
    let user;
    if (password) {
      user = db.prepare("SELECT * FROM users WHERE username = ? AND password = ?").get(username, password);
    } else if (pin) {
      user = db.prepare("SELECT * FROM users WHERE username = ? AND pin = ?").get(username, pin);
    }

    if (user) {
      if (user.status === 'Pending') return res.status(403).json({ success: false, message: 'Account pending approval' });
      if (user.status === 'Rejected') return res.status(403).json({ success: false, message: 'Account has been rejected' });
      
      const userObj = { ...user, emailNotifications: !!user.emailNotifications, requiresSetup: !!user.requiresSetup };
      res.json({ success: true, user: userObj });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  });

  app.post("/api/users/register", (req, res) => {
    const { id, username, password, pin, fullName, email, phone, department, jobTitle, headOfDepartment, role, status, createdAt, emailNotifications } = req.body;
    try {
      db.prepare(`
        INSERT INTO users (id, username, password, pin, fullName, email, phone, department, jobTitle, headOfDepartment, role, status, createdAt, emailNotifications)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, username, password, pin, fullName, email, phone, department, jobTitle, headOfDepartment, role, status, createdAt, emailNotifications ? 1 : 0);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  });

  app.patch("/api/users/:id", (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    // Prevent modifying the admin user via API
    const user = db.prepare("SELECT username FROM users WHERE id = ?").get(id);
    if (user && user.username === 'admin') {
      return res.status(403).json({ success: false, message: 'Cannot modify system administrator' });
    }

    const keys = Object.keys(updates);
    const values = Object.values(updates).map(v => typeof v === 'boolean' ? (v ? 1 : 0) : v);
    
    const setClause = keys.map(k => `${k} = ?`).join(", ");
    db.prepare(`UPDATE users SET ${setClause} WHERE id = ?`).run(...values, id);
    res.json({ success: true });
  });

  // Bookings
  app.get("/api/bookings", (req, res) => {
    const bookings = db.prepare("SELECT * FROM bookings").all();
    res.json(bookings.map((b: any) => ({ ...b, approvals: b.approvals ? JSON.parse(b.approvals) : [] })));
  });

  app.post("/api/bookings", (req, res) => {
    const booking = req.body;
    db.prepare(`
      INSERT INTO bookings (id, userId, userName, userDepartment, facility, date, timeSlot, status, createdAt, termsAcceptedAt, approvals)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(booking.id, booking.userId, booking.userName, booking.userDepartment, booking.facility, booking.date, booking.timeSlot, booking.status, booking.createdAt, booking.termsAcceptedAt, JSON.stringify(booking.approvals || []));
    res.json({ success: true });
  });

  app.patch("/api/bookings/:id", (req, res) => {
    const { id } = req.params;
    const { status, rejectionReason, approvals } = req.body;
    
    let query = "UPDATE bookings SET status = ?";
    const params = [status];

    if (rejectionReason !== undefined) {
      query += ", rejectionReason = ?";
      params.push(rejectionReason);
    }
    if (approvals !== undefined) {
      query += ", approvals = ?";
      params.push(JSON.stringify(approvals));
    }

    query += " WHERE id = ?";
    params.push(id);

    db.prepare(query).run(...params);
    res.json({ success: true });
  });

  // Waitlist
  app.get("/api/waitlist", (req, res) => {
    const waitlist = db.prepare("SELECT * FROM waitlist").all();
    res.json(waitlist);
  });

  app.post("/api/waitlist", (req, res) => {
    const entry = req.body;
    db.prepare(`
      INSERT INTO waitlist (id, userId, userName, facility, date, timeSlot, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(entry.id, entry.userId, entry.userName, entry.facility, entry.date, entry.timeSlot, entry.createdAt);
    res.json({ success: true });
  });

  // Issues
  app.get("/api/issues", (req, res) => {
    const issues = db.prepare("SELECT * FROM issues").all();
    res.json(issues);
  });

  app.post("/api/issues", (req, res) => {
    const issue = req.body;
    db.prepare(`
      INSERT INTO issues (id, facility, description, status, createdAt, reportedBy)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(issue.id, issue.facility, issue.description, issue.status, issue.createdAt, issue.reportedBy);
    res.json({ success: true });
  });

  app.patch("/api/issues/:id", (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    db.prepare("UPDATE issues SET status = ? WHERE id = ?").run(status, id);
    res.json({ success: true });
  });

  // Approval Configs
  app.get("/api/approval-configs", (req, res) => {
    const configs = db.prepare("SELECT * FROM approval_configs").all();
    const result: Record<string, any> = {};
    configs.forEach((c: any) => {
      result[c.department] = {
        managerIds: JSON.parse(c.managerIds),
        logic: c.logic
      };
    });
    res.json(result);
  });

  app.post("/api/approval-configs", (req, res) => {
    const { department, config } = req.body;
    db.prepare(`
      INSERT INTO approval_configs (department, managerIds, logic)
      VALUES (?, ?, ?)
      ON CONFLICT(department) DO UPDATE SET
        managerIds = excluded.managerIds,
        logic = excluded.logic
    `).run(department, JSON.stringify(config.managerIds), config.logic);
    res.json({ success: true });
  });

  // Notifications
  app.post("/api/notify", (req, res) => {
    const { userId, message, type } = req.body;
    io.to(userId).emit("notification", { 
      message, 
      type, 
      timestamp: new Date().toISOString() 
    });
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
