import streamlit as st
import sqlite3
import pandas as pd
from datetime import datetime
import hashlib
import json

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

# --- Page Config ---
st.set_page_config(page_title="Thames City Staff Portal", page_icon="🏢", layout="wide")

# Custom CSS for Thames City Branding
st.markdown("""
    <style>
    .stApp {
        background-color: #0A0A0A;
        color: #FFFFFF;
    }
    .stButton>button {
        background-color: #C5A059;
        color: #0A0A0A;
        font-weight: bold;
        border-radius: 5px;
        border: none;
    }
    .stButton>button:hover {
        background-color: #D4B478;
        color: #0A0A0A;
    }
    .stTextInput>div>div>input, .stSelectbox>div>div>div {
        background-color: #1A1A1A;
        color: #FFFFFF;
        border: 1px solid #C5A059;
    }
    .stHeader {
        color: #C5A059;
    }
    h1, h2, h3 {
        color: #C5A059 !important;
    }
    </style>
""", unsafe_allow_html=True)

# --- Session State ---
if 'user' not in st.session_state:
    st.session_state.user = None

# --- Auth Functions ---
def login(username, password_or_pin, is_pin=False):
    conn = get_db_connection()
    cursor = conn.cursor()
    if is_pin:
        cursor.execute("SELECT * FROM users WHERE username = ? AND pin = ?", (username, password_or_pin))
    else:
        cursor.execute("SELECT * FROM users WHERE username = ? AND password = ?", (username, password_or_pin))
    user = cursor.fetchone()
    conn.close()
    
    if user:
        if user['status'] == 'Pending':
            return False, "Account pending approval"
        if user['status'] == 'Rejected':
            return False, "Account has been rejected"
        st.session_state.user = dict(user)
        return True, "Login successful"
    return False, "Invalid credentials"

def logout():
    st.session_state.user = None
    st.rerun()

# --- Main App Logic ---
def main():
    if not st.session_state.user:
        show_login_page()
    else:
        show_dashboard()

def show_login_page():
    st.image("public/logo.svg", width=150)
    st.title("🏢 Thames City Staff Portal")
    st.subheader("Login to your account")
    
    tab1, tab2 = st.tabs(["Password Login", "PIN Login"])
    
    with tab1:
        username = st.text_input("Username", key="user_pass")
        password = st.text_input("Password", type="password", key="pass_pass")
        if st.button("Login with Password"):
            success, message = login(username, password)
            if success:
                st.success(message)
                st.rerun()
            else:
                st.error(message)
                
    with tab2:
        username_pin = st.text_input("Username", key="user_pin")
        pin = st.text_input("4-Digit PIN", type="password", key="pin_pin", max_chars=4)
        if st.button("Login with PIN"):
            success, message = login(username_pin, pin, is_pin=True)
            if success:
                st.success(message)
                st.rerun()
            else:
                st.error(message)
    
    st.divider()
    if st.button("Register New Account"):
        st.session_state.show_register = True
        st.rerun()

    if st.session_state.get('show_register'):
        show_register_modal()

def show_register_modal():
    st.title("📝 Register Account")
    with st.form("register_form"):
        fullName = st.text_input("Full Name")
        email = st.text_input("Email")
        phone = st.text_input("Phone")
        department = st.selectbox("Department", ["Security", "Concierge", "Housekeeping", "Amenities", "LRM", "Management"])
        jobTitle = st.text_input("Job Title")
        username = st.text_input("Username")
        password = st.text_input("Password", type="password")
        pin = st.text_input("4-Digit PIN", type="password", max_chars=4)
        
        submitted = st.form_submit_button("Submit for Approval")
        if submitted:
            conn = get_db_connection()
            cursor = conn.cursor()
            try:
                user_id = hashlib.md5(username.encode()).hexdigest()[:9]
                cursor.execute("""
                    INSERT INTO users (id, username, password, pin, fullName, email, phone, department, jobTitle, headOfDepartment, role, status, createdAt, emailNotifications)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (user_id, username, password, pin, fullName, email, phone, department, jobTitle, "N/A", "Staff", "Pending", datetime.now().isoformat(), 1))
                conn.commit()
                st.success("Registration submitted! Please wait for admin approval.")
                st.session_state.show_register = False
            except Exception as e:
                st.error(f"Error: {e}")
            finally:
                conn.close()
    
    if st.button("Back to Login"):
        st.session_state.show_register = False
        st.rerun()

def show_dashboard():
    user = st.session_state.user
    st.sidebar.image("public/logo.svg", width=100)
    st.sidebar.title(f"Welcome, {user['fullName']}")
    st.sidebar.write(f"Role: {user['role']}")
    st.sidebar.write(f"Department: {user['department']}")
    
    if st.sidebar.button("Logout"):
        logout()
    
    menu = ["Home", "Bookings", "Issues", "Settings"]
    if user['role'] in ['Admin', 'Owner']:
        menu.append("Admin Panel")
    if user['role'] in ['Manager', 'Admin', 'Owner']:
        menu.append("Approvals")
        
    choice = st.sidebar.selectbox("Navigation", menu)
    
    if choice == "Home":
        show_home()
    elif choice == "Bookings":
        show_bookings()
    elif choice == "Issues":
        show_issues()
    elif choice == "Settings":
        show_settings()
    elif choice == "Admin Panel":
        show_admin_panel()
    elif choice == "Approvals":
        show_approvals()

def show_home():
    st.title("🏠 Dashboard Home")
    user = st.session_state.user
    
    col1, col2, col3 = st.columns(3)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) FROM bookings WHERE userId = ?", (user['id'],))
    my_bookings_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM bookings WHERE status = 'Pending'")
    pending_bookings_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM issues WHERE status = 'Open'")
    open_issues_count = cursor.fetchone()[0]
    
    conn.close()
    
    col1.metric("My Bookings", my_bookings_count)
    col2.metric("Pending Approvals", pending_bookings_count)
    col3.metric("Open Issues", open_issues_count)
    
    st.divider()
    st.write("### Recent Activity")
    st.info("No recent activity to show.")

def show_bookings():
    st.title("📅 Facility Bookings")
    user = st.session_state.user
    
    tab1, tab2 = st.tabs(["New Booking", "My Bookings"])
    
    with tab1:
        st.subheader("Book a Session")
        facility = st.selectbox("Facility", ["Gym", "Pool"])
        date = st.date_input("Date", min_value=datetime.now().date())
        time_slot = st.selectbox("Time Slot", [
            "06:00 - 07:00", "07:00 - 08:00", "08:00 - 09:00",
            "09:00 - 10:00", "10:00 - 11:00", "11:00 - 12:00",
            "12:00 - 13:00", "13:00 - 14:00", "14:00 - 15:00",
            "15:00 - 16:00", "16:00 - 17:00", "17:00 - 18:00",
            "18:00 - 19:00", "19:00 - 20:00", "20:00 - 21:00"
        ])
        
        if st.button("Request Booking"):
            conn = get_db_connection()
            cursor = conn.cursor()
            booking_id = hashlib.md5(f"{user['id']}{date}{time_slot}".encode()).hexdigest()[:9]
            cursor.execute("""
                INSERT INTO bookings (id, userId, userName, userDepartment, facility, date, timeSlot, status, createdAt, termsAcceptedAt, approvals)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (booking_id, user['id'], user['fullName'], user['department'], facility, str(date), time_slot, "Pending", datetime.now().isoformat(), datetime.now().isoformat(), "[]"))
            conn.commit()
            conn.close()
            st.success("Booking request submitted!")
            
    with tab2:
        st.subheader("Your Bookings")
        conn = get_db_connection()
        df = pd.read_sql_query("SELECT facility, date, timeSlot, status FROM bookings WHERE userId = ?", conn, params=(user['id'],))
        conn.close()
        if not df.empty:
            st.dataframe(df, use_container_width=True)
        else:
            st.write("No bookings found.")

def show_issues():
    st.title("⚠️ Equipment Issues")
    user = st.session_state.user
    
    with st.form("report_issue"):
        facility = st.selectbox("Facility", ["Gym", "Pool"])
        description = st.text_area("Description of the issue")
        if st.form_submit_button("Report Issue"):
            conn = get_db_connection()
            cursor = conn.cursor()
            issue_id = hashlib.md5(f"{user['id']}{datetime.now()}".encode()).hexdigest()[:9]
            cursor.execute("""
                INSERT INTO issues (id, facility, description, status, createdAt, reportedBy)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (issue_id, facility, description, "Open", datetime.now().isoformat(), user['id']))
            conn.commit()
            conn.close()
            st.success("Issue reported to admin.")

def show_settings():
    st.title("⚙️ Settings")
    user = st.session_state.user
    
    st.subheader("Profile Information")
    st.write(f"**Name:** {user['fullName']}")
    st.write(f"**Email:** {user['email']}")
    st.write(f"**Phone:** {user['phone']}")
    
    st.divider()
    st.subheader("Security")
    new_password = st.text_input("New Password", type="password")
    new_pin = st.text_input("New 4-Digit PIN", type="password", max_chars=4)
    if st.button("Update Security Settings"):
        conn = get_db_connection()
        cursor = conn.cursor()
        if new_password:
            cursor.execute("UPDATE users SET password = ? WHERE id = ?", (new_password, user['id']))
        if new_pin:
            cursor.execute("UPDATE users SET pin = ? WHERE id = ?", (new_pin, user['id']))
        conn.commit()
        conn.close()
        st.success("Security settings updated!")

def show_admin_panel():
    st.title("🛡️ Admin Panel")
    
    tab1, tab2, tab3 = st.tabs(["User Management", "All Bookings", "System Issues"])
    
    conn = get_db_connection()
    
    with tab1:
        st.subheader("Pending Approvals")
        pending_users = pd.read_sql_query("SELECT id, username, fullName, department, status FROM users WHERE status = 'Pending'", conn)
        if not pending_users.empty:
            for _, row in pending_users.iterrows():
                col1, col2, col3 = st.columns([3, 1, 1])
                col1.write(f"{row['fullName']} ({row['department']})")
                if col2.button("Approve", key=f"app_{row['id']}"):
                    cursor = conn.cursor()
                    cursor.execute("UPDATE users SET status = 'Active' WHERE id = ?", (row['id'],))
                    conn.commit()
                    st.rerun()
                if col3.button("Reject", key=f"rej_{row['id']}"):
                    cursor = conn.cursor()
                    cursor.execute("UPDATE users SET status = 'Rejected' WHERE id = ?", (row['id'],))
                    conn.commit()
                    st.rerun()
        else:
            st.write("No pending user approvals.")
            
        st.subheader("All Users")
        all_users = pd.read_sql_query("SELECT username, fullName, department, role, status FROM users WHERE username != 'admin'", conn)
        st.dataframe(all_users, use_container_width=True)
        
    with tab2:
        st.subheader("System Bookings")
        all_bookings = pd.read_sql_query("SELECT userName, facility, date, timeSlot, status FROM bookings", conn)
        st.dataframe(all_bookings, use_container_width=True)
        
    with tab3:
        st.subheader("Reported Issues")
        all_issues = pd.read_sql_query("SELECT facility, description, status, createdAt FROM issues", conn)
        st.dataframe(all_issues, use_container_width=True)
        
    conn.close()

def show_approvals():
    st.title("✅ Manager Approvals")
    user = st.session_state.user
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Show bookings pending for this manager's department
    query = "SELECT * FROM bookings WHERE status = 'Pending'"
    if user['role'] == 'Manager':
        query += f" AND userDepartment = '{user['department']}'"
        
    pending_bookings = pd.read_sql_query(query, conn)
    
    if not pending_bookings.empty:
        for _, row in pending_bookings.iterrows():
            col1, col2, col3 = st.columns([3, 1, 1])
            col1.write(f"**{row['userName']}** - {row['facility']} on {row['date']} ({row['timeSlot']})")
            if col2.button("Approve", key=f"b_app_{row['id']}"):
                cursor.execute("UPDATE bookings SET status = 'Approved' WHERE id = ?", (row['id'],))
                conn.commit()
                st.rerun()
            if col3.button("Reject", key=f"b_rej_{row['id']}"):
                cursor.execute("UPDATE bookings SET status = 'Rejected' WHERE id = ?", (row['id'],))
                conn.commit()
                st.rerun()
    else:
        st.write("No pending bookings to approve.")
        
    conn.close()

if __name__ == "__main__":
    main()
