import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  // Initialize Database
  const db = await open({
    filename: "thames_city.db",
    driver: sqlite3.Database,
  });

  // Create Tables
  await db.exec(`
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
  const adminExists = await db.get("SELECT id FROM users WHERE username = ?", "admin");
  if (!adminExists) {
    await db.run(`
      INSERT INTO users (id, username, password, pin, fullName, email, phone, department, jobTitle, headOfDepartment, role, status, createdAt, emailNotifications)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
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
    await db.run("UPDATE users SET password = ? WHERE username = ?", "TCSB123!", "admin");
  }

  // Seed 1974 Club Sample Staff
  const clubStaffExists = await db.get("SELECT id FROM users WHERE username = ?", "club1974");
  if (!clubStaffExists) {
    await db.run(`
      INSERT INTO users (id, username, password, pin, fullName, email, phone, department, jobTitle, headOfDepartment, role, status, createdAt, emailNotifications)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      "staff-1974",
      "club1974",
      "password123",
      "1974",
      "1974 Club Staff",
      "club@thamescity.com",
      "07700001974",
      "1974 Club",
      "Club Attendant",
      "Club Manager",
      "Staff",
      "Active",
      new Date().toISOString(),
      1
    );
  } else {
    await db.run("UPDATE users SET role = ? WHERE username = ?", "Staff", "club1974");
  }

  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  const PORT = Number(process.env.PORT) || 3000;

  // Socket.io logic
  io.on("connection", (socket) => {
    socket.on("join-room", (userId) => {
      socket.join(userId);
    });
  });

  app.use(express.json());

  // API Routes
  
  // Users
  app.get("/api/users", async (req, res) => {
    const users = await db.all("SELECT * FROM users WHERE username != 'admin'");
    res.json(users.map((u: any) => ({ ...u, emailNotifications: !!u.emailNotifications, requiresSetup: !!u.requiresSetup })));
  });

  app.post("/api/login", async (req, res) => {
    const { username, password, pin } = req.body;
    let user;
    if (password) {
      user = await db.get("SELECT * FROM users WHERE username = ? AND password = ?", username, password);
    } else if (pin) {
      user = await db.get("SELECT * FROM users WHERE username = ? AND pin = ?", username, pin);
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

  app.post("/api/users/register", async (req, res) => {
    const { id, username, password, pin, fullName, email, phone, department, jobTitle, headOfDepartment, role, status, createdAt, emailNotifications } = req.body;
    try {
      await db.run(`
        INSERT INTO users (id, username, password, pin, fullName, email, phone, department, jobTitle, headOfDepartment, role, status, createdAt, emailNotifications)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, id, username, password, pin, fullName, email, phone, department, jobTitle, headOfDepartment, role, status, createdAt, emailNotifications ? 1 : 0);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    // Prevent modifying the admin user via API
    const user = await db.get("SELECT username FROM users WHERE id = ?", id);
    if (user && user.username === 'admin') {
      return res.status(403).json({ success: false, message: 'Cannot modify system administrator' });
    }

    const keys = Object.keys(updates);
    const values = Object.values(updates).map(v => typeof v === 'boolean' ? (v ? 1 : 0) : v);
    
    const setClause = keys.map(k => `${k} = ?`).join(", ");
    await db.run(`UPDATE users SET ${setClause} WHERE id = ?`, ...values, id);
    res.json({ success: true });
  });

  // Bookings
  app.get("/api/bookings", async (req, res) => {
    const bookings = await db.all("SELECT * FROM bookings");
    res.json(bookings.map((b: any) => ({ ...b, approvals: b.approvals ? JSON.parse(b.approvals) : [] })));
  });

  app.post("/api/bookings", async (req, res) => {
    const booking = req.body;
    await db.run(`
      INSERT INTO bookings (id, userId, userName, userDepartment, facility, date, timeSlot, status, createdAt, termsAcceptedAt, approvals)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, booking.id, booking.userId, booking.userName, booking.userDepartment, booking.facility, booking.date, booking.timeSlot, booking.status, booking.createdAt, booking.termsAcceptedAt, JSON.stringify(booking.approvals || []));
    res.json({ success: true });
  });

  app.patch("/api/bookings/:id", async (req, res) => {
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

    await db.run(query, ...params);
    res.json({ success: true });
  });

  // Waitlist
  app.get("/api/waitlist", async (req, res) => {
    const waitlist = await db.all("SELECT * FROM waitlist");
    res.json(waitlist);
  });

  app.post("/api/waitlist", async (req, res) => {
    const entry = req.body;
    await db.run(`
      INSERT INTO waitlist (id, userId, userName, facility, date, timeSlot, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, entry.id, entry.userId, entry.userName, entry.facility, entry.date, entry.timeSlot, entry.createdAt);
    res.json({ success: true });
  });

  // Issues
  app.get("/api/issues", async (req, res) => {
    const issues = await db.all("SELECT * FROM issues");
    res.json(issues);
  });

  app.post("/api/issues", async (req, res) => {
    const issue = req.body;
    await db.run(`
      INSERT INTO issues (id, facility, description, status, createdAt, reportedBy)
      VALUES (?, ?, ?, ?, ?, ?)
    `, issue.id, issue.facility, issue.description, issue.status, issue.createdAt, issue.reportedBy);
    res.json({ success: true });
  });

  app.patch("/api/issues/:id", async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    await db.run("UPDATE issues SET status = ? WHERE id = ?", status, id);
    res.json({ success: true });
  });

  // Approval Configs
  app.get("/api/approval-configs", async (req, res) => {
    const configs = await db.all("SELECT * FROM approval_configs");
    const result: Record<string, any> = {};
    configs.forEach((c: any) => {
      result[c.department] = {
        managerIds: JSON.parse(c.managerIds),
        logic: c.logic
      };
    });
    res.json(result);
  });

  app.post("/api/approval-configs", async (req, res) => {
    const { department, config } = req.body;
    // SQLite doesn't have ON CONFLICT DO UPDATE for INSERT in all versions, 
    // but sqlite3/sqlite wrapper supports it if the underlying sqlite version is 3.24.0+
    // For safety, let's use a DELETE then INSERT or a more portable approach.
    await db.run("DELETE FROM approval_configs WHERE department = ?", department);
    await db.run(`
      INSERT INTO approval_configs (department, managerIds, logic)
      VALUES (?, ?, ?)
    `, department, JSON.stringify(config.managerIds), config.logic);
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
