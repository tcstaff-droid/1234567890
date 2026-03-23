# Hosting on Krystal

This application is a full-stack app with a React frontend and a FastAPI (Python) backend. To host it on Krystal, follow these instructions.

## Option 1: Krystal Cloud Hosting (cPanel)

If you are using Krystal's standard cPanel-based hosting:

1.  **Build the Frontend**:
    Run `npm run build` on your local machine. This creates a `dist` folder.
2.  **Upload Files**:
    Upload the entire project (including the `dist` folder) to your `public_html` or a subdirectory via FTP/File Manager.
3.  **Setup Python App**:
    - In cPanel, go to **Setup Python App**.
    - Create a new application.
    - **Python Version**: Select 3.9 or higher.
    - **Application root**: The folder where you uploaded the files.
    - **Application URL**: Your domain.
    - **Application startup file**: `main.py`.
    - **Application Entry point**: `socket_app` (since we use Socket.io).
4.  **Install Dependencies**:
    - Once the app is created, click **Edit**.
    - In the "Configuration files" section, add `requirements.txt` and click **Add**.
    - Click **Run Pip Install** and select `requirements.txt`.
5.  **Environment Variables**:
    - Add any necessary environment variables in the Python App setup (e.g., `PORT`).

## Option 2: Katapult (VPS)

If you are using Krystal's Katapult VPS:

1.  **Server Setup**:
    Ensure you have Python 3.9+ and Node.js installed.
2.  **Clone and Build**:
    ```bash
    git clone <your-repo-url>
    cd <your-repo-name>
    npm install
    npm run build
    pip install -r requirements.txt
    ```
3.  **Run with Systemd**:
    Create a systemd service file to keep the app running:
    ```ini
    [Unit]
    Description=Thames City Booking App
    After=network.target

    [Service]
    User=youruser
    Group=www-data
    WorkingDirectory=/path/to/your/app
    Environment="PATH=/path/to/your/app/venv/bin"
    Environment="PORT=3001"
    ExecStart=/path/to/your/app/venv/bin/python3 main.py

    [Install]
    WantedBy=multi-user.target
    ```
4.  **Reverse Proxy**:
    Use Nginx to proxy traffic from port 80/443 to port 3001.

## Database

The app uses a local SQLite database (`thames_city.db`). Ensure the application has write permissions to the directory where this file is located.

## Real-time Notifications

The app uses Socket.io. If you are using a reverse proxy (like Nginx), ensure it is configured to handle WebSocket connections.
