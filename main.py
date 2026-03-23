from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import sqlite3
import json
import socketio
import uvicorn
from datetime import datetime
import os

# --- Database Setup ---
DB_NAME = "thames_city.db"

def get_db_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.executescript("""
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
    """)
    
    # Seed Admin
    cursor.execute("SELECT id FROM users WHERE username = 'admin'")
    if not cursor.fetchone():
        cursor.execute("""
            INSERT INTO users (id, username, password, pin, fullName, email, phone, department, jobTitle, headOfDepartment, role, status, createdAt, emailNotifications)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, ("admin-1", "admin", "TCSB123!", "1234", "System Administrator", "admin@thamescity.com", "0000000000", "Management", "Admin", "N/A", "Admin", "Active", datetime.now().isoformat(), 1))
    else:
        cursor.execute("UPDATE users SET password = ? WHERE username = ?", ("TCSB123!", "admin"))
    
    conn.commit()
    conn.close()

init_db()

# --- FastAPI Setup ---
app = FastAPI(title="Thames City API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to the Vercel frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Socket.io Setup ---
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
socket_app = socketio.ASGIApp(sio, app)

@sio.on('join-room')
async def handle_join_room(sid, userId):
    await sio.enter_room(sid, userId)

# --- Models ---
class UserLogin(BaseModel):
    username: str
    password: Optional[str] = None
    pin: Optional[str] = None

class UserRegister(BaseModel):
    id: str
    username: str
    password: str
    pin: str
    fullName: str
    email: str
    phone: str
    department: str
    jobTitle: str
    headOfDepartment: str
    role: str
    status: str
    createdAt: str
    emailNotifications: bool

class BookingCreate(BaseModel):
    id: str
    userId: str
    userName: str
    userDepartment: str
    facility: str
    date: str
    timeSlot: str
    status: str
    createdAt: str
    termsAcceptedAt: str
    approvals: Optional[List[str]] = []

class BookingUpdate(BaseModel):
    status: str
    rejectionReason: Optional[str] = None
    approvals: Optional[List[str]] = None

class WaitlistCreate(BaseModel):
    id: str
    userId: str
    userName: str
    facility: str
    date: str
    timeSlot: str
    createdAt: str

class IssueCreate(BaseModel):
    id: str
    facility: str
    description: str
    status: str
    createdAt: str
    reportedBy: str

class ApprovalConfigUpdate(BaseModel):
    department: str
    config: Dict[str, Any]

class NotificationRequest(BaseModel):
    userId: str
    message: str
    type: str

# --- Routes ---

@app.get("/api/users")
async def get_users():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username != 'admin'")
    users = [dict(row) for row in cursor.fetchall()]
    conn.close()
    for u in users:
        u['emailNotifications'] = bool(u['emailNotifications'])
        u['requiresSetup'] = bool(u.get('requiresSetup', 0))
    return users

@app.post("/api/login")
async def login(login_data: UserLogin):
    conn = get_db_connection()
    cursor = conn.cursor()
    user = None
    if login_data.password:
        cursor.execute("SELECT * FROM users WHERE username = ? AND password = ?", (login_data.username, login_data.password))
        user = cursor.fetchone()
    elif login_data.pin:
        cursor.execute("SELECT * FROM users WHERE username = ? AND pin = ?", (login_data.username, login_data.pin))
        user = cursor.fetchone()
    conn.close()

    if user:
        user_dict = dict(user)
        if user_dict['status'] == 'Pending':
            raise HTTPException(status_code=403, detail="Account pending approval")
        if user_dict['status'] == 'Rejected':
            raise HTTPException(status_code=403, detail="Account has been rejected")
        
        user_dict['emailNotifications'] = bool(user_dict['emailNotifications'])
        user_dict['requiresSetup'] = bool(user_dict.get('requiresSetup', 0))
        return {"success": True, "user": user_dict}
    else:
        raise HTTPException(status_code=401, detail="Invalid credentials")

@app.post("/api/users/register")
async def register(user: UserRegister):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO users (id, username, password, pin, fullName, email, phone, department, jobTitle, headOfDepartment, role, status, createdAt, emailNotifications)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (user.id, user.username, user.password, user.pin, user.fullName, user.email, user.phone, user.department, user.jobTitle, user.headOfDepartment, user.role, user.status, user.createdAt, 1 if user.emailNotifications else 0))
        conn.commit()
        return {"success": True}
    except sqlite3.IntegrityError as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()

@app.patch("/api/users/{user_id}")
async def update_user(user_id: str, updates: Dict[str, Any]):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if admin
    cursor.execute("SELECT username FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()
    if user and user['username'] == 'admin':
        raise HTTPException(status_code=403, detail="Cannot modify system administrator")

    keys = list(updates.keys())
    values = [1 if v is True else 0 if v is False else v for v in updates.values()]
    
    set_clause = ", ".join([f"{k} = ?" for k in keys])
    cursor.execute(f"UPDATE users SET {set_clause} WHERE id = ?", (*values, user_id))
    conn.commit()
    conn.close()
    return {"success": True}

@app.get("/api/bookings")
async def get_bookings():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM bookings")
    bookings = [dict(row) for row in cursor.fetchall()]
    conn.close()
    for b in bookings:
        b['approvals'] = json.loads(b['approvals']) if b['approvals'] else []
    return bookings

@app.post("/api/bookings")
async def create_booking(booking: BookingCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO bookings (id, userId, userName, userDepartment, facility, date, timeSlot, status, createdAt, termsAcceptedAt, approvals)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (booking.id, booking.userId, booking.userName, booking.userDepartment, booking.facility, booking.date, booking.timeSlot, booking.status, booking.createdAt, booking.termsAcceptedAt, json.dumps(booking.approvals or [])))
    conn.commit()
    conn.close()
    return {"success": True}

@app.patch("/api/bookings/{booking_id}")
async def update_booking(booking_id: str, update: BookingUpdate):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = "UPDATE bookings SET status = ?"
    params = [update.status]

    if update.rejectionReason is not None:
        query += ", rejectionReason = ?"
        params.append(update.rejectionReason)
    if update.approvals is not None:
        query += ", approvals = ?"
        params.append(json.dumps(update.approvals))

    query += " WHERE id = ?"
    params.append(booking_id)

    cursor.execute(query, params)
    conn.commit()
    conn.close()
    return {"success": True}

@app.get("/api/waitlist")
async def get_waitlist():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM waitlist")
    waitlist = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return waitlist

@app.post("/api/waitlist")
async def create_waitlist_entry(entry: WaitlistCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO waitlist (id, userId, userName, facility, date, timeSlot, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (entry.id, entry.userId, entry.userName, entry.facility, entry.date, entry.timeSlot, entry.createdAt))
    conn.commit()
    conn.close()
    return {"success": True}

@app.get("/api/issues")
async def get_issues():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM issues")
    issues = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return issues

@app.post("/api/issues")
async def create_issue(issue: IssueCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO issues (id, facility, description, status, createdAt, reportedBy)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (issue.id, issue.facility, issue.description, issue.status, issue.createdAt, issue.reportedBy))
    conn.commit()
    conn.close()
    return {"success": True}

@app.patch("/api/issues/{issue_id}")
async def update_issue(issue_id: str, updates: Dict[str, Any]):
    conn = get_db_connection()
    cursor = conn.cursor()
    status = updates.get('status')
    if status:
        cursor.execute("UPDATE issues SET status = ? WHERE id = ?", (status, issue_id))
        conn.commit()
    conn.close()
    return {"success": True}

@app.get("/api/approval-configs")
async def get_approval_configs():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM approval_configs")
    configs = [dict(row) for row in cursor.fetchall()]
    conn.close()
    result = {}
    for c in configs:
        result[c['department']] = {
            "managerIds": json.loads(c['managerIds']),
            "logic": c['logic']
        }
    return result

@app.post("/api/approval-configs")
async def update_approval_config(data: ApprovalConfigUpdate):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO approval_configs (department, managerIds, logic)
        VALUES (?, ?, ?)
        ON CONFLICT(department) DO UPDATE SET
            managerIds = excluded.managerIds,
            logic = excluded.logic
    """, (data.department, json.dumps(data.config['managerIds']), data.config['logic']))
    conn.commit()
    conn.close()
    return {"success": True}

@app.post("/api/notify")
async def notify(data: NotificationRequest):
    await sio.emit("notification", {
        "message": data.message,
        "type": data.type,
        "timestamp": datetime.now().isoformat()
    }, room=data.userId)
    return {"success": True}

# --- Static Files & SPA Routing ---

# Mount the static files directory (built from React)
# This should be at the end to not interfere with API routes
if os.path.exists("dist"):
    app.mount("/assets", StaticFiles(directory="dist/assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(request: Request, full_path: str):
        # If the path starts with api, it should have been handled by the API routes
        if full_path.startswith("api"):
            raise HTTPException(status_code=404, detail="API route not found")
        
        # Check if the file exists in dist
        file_path = os.path.join("dist", full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        
        # Otherwise serve index.html for SPA routing
        return FileResponse("dist/index.html")

# --- Main ---
if __name__ == "__main__":
    # In AI Studio, PORT is 3000. We use 3001 for the backend to avoid conflict with Vite on 3000.
    # For production (Krystal), we'll use the PORT env var if it's provided and not 3000, 
    # or if we're running the built app.
    env_port = os.environ.get("PORT")
    if env_port and env_port != "3000":
        port = int(env_port)
    else:
        port = 3001
    
    print(f"Starting backend on port {port}...")
    uvicorn.run(socket_app, host="0.0.0.0", port=port)
