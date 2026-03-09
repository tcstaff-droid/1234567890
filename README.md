# Thames City Staff Booking Portal

A professional full-stack booking application for Thames City staff to manage facility usage (Gym & Pool).

## 🚀 Features
- **Multi-user Roles**: Owner, Admin, Manager, and Staff.
- **Real-time Notifications**: Live updates for booking approvals and system alerts.
- **Persistent Backend**: Powered by a SQLite database for reliable data storage.
- **Approval Workflows**: Customizable multi-manager approval logic per department.
- **Waitlist System**: Automated notifications when slots become available.
- **Issue Reporting**: Track and resolve facility equipment issues.
- **CSV Export**: Export booking data for administrative reporting.

## 🛠️ Tech Stack
- **Frontend**: React 19, Tailwind CSS, Lucide Icons, Motion.
- **Backend**: Node.js (Express) or Python (Streamlit).
- **Database**: SQLite.
- **Real-time**: Socket.io (Node.js version).

## 📦 Installation & Setup

### Option 1: Node.js Full-Stack (Recommended)
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Access the app at `http://localhost:3000`.

### Option 2: Streamlit (Python)
1. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Run the Streamlit app:
   ```bash
   streamlit run app.py
   ```

## 🔑 Initial Admin Credentials
- **Username**: `admin`
- **Password**: `password123`
- **PIN**: `1234`

## 📂 Project Structure
- `src/`: React frontend source code.
- `server.ts`: Express backend server.
- `app.py`: Streamlit application for Python hosting.
- `thames_city.db`: SQLite database file.
- `metadata.json`: Application metadata and permissions.
