# 🚀 WKPC Meta Automation & Real-Time Intelligence

**An Enterprise-Grade SaaS for Automating Facebook Lead Ads with AI Scoring, Drag-and-Drop Workflows, and Advanced Analytics.**

---

## 🌟 Project Overview
This project is a high-performance **Automation & CRM Platform** designed to handle leads from **Meta (Facebook/Instagram) Lead Ads** in real-time. It goes beyond simple data capture by introducing **Robotic Process Automation (RPA)**, **AI-driven Lead Scoring**, and **Multi-Channel Auto-Responders** (Email, WhatsApp).

It serves as a "Middle-ware" intelligence layer between Facebook Ads and your Sales Team, ensuring no lead is left unattended.

---

## 🔥 Key Features

### 1. 🤖 Visual RPA Workflow Builder
*   **Drag & Drop Interface:** Build complex automation flows visually (React Flow).
*   **Nodes:** Trigger (Lead Created), Action (Send Email/WhatsApp), Wait, and **Condition**.
*   **Smart Branching:** True `If/Else` logic based on Lead Score, Status, or Source.
*   **Resiliency:** Built-in **Circuit Breaker** (pauses on high failure rates) and **Exponential Backoff** retries.
*   **Git-Style Version Control:** Commit history, Rollback to previous versions, and Draft vs. Live modes.

### 2. 🧠 AI Lead Scoring
*   **Intelligent Analysis:** Automatically assigns a quality score (0-100) to every new lead.
*   **Reasoning Engine:** Explains *why* a lead got a certain score (e.g., "High intent detected", "Invalid phone number").
*   **Routing:** High-score leads can be routed to "Priority Sales" WhatsApp groups automatically.

### 3. 🏢 SaaS & Multi-Tenancy
*   **Organization-Based:** Supports multiple companies (Organizations) with isolated data.
*   **RBAC (Role-Based Access Control):** Super Admin, Admin, and User roles with specific permissions.
*   **Team Management:** Invite/Remove team members securely.

### 4. ⚡ Real-Time Dashboard
*   **Instant Updates:** New leads appear instantly via **Socket.io** (no page refresh).
*   **Live Charts:** Visual analytics for conversion rates, lead sources, and daily trends.
*   **Lead Management:** Filtering, Bulk Delete, Assignment, and Status Tracking (New -> Converted).

---

## 🛠️ Tech Stack

### Frontend
*   **Framework:** React 18 (Vite)
*   **Styling:** Tailwind CSS 3
*   **Visualization:** React Flow (Workflow Builder), Recharts (Analytics)
*   **State/API:** Context API, Axios
*   **Icons:** Lucide React

### Backend
*   **Runtime:** Node.js & Express.js
*   **Database:** MongoDB Atlas (Mongoose ODM)
*   **Real-Time:** Socket.io
*   **Security:** JWT Auth, Helmet, Rate Limiting, XSS Clean
*   **Automation:** Custom-built Graph Traversal Engine

### Integrations
*   **Meta Graph API:** For Webhooks & WhatsApp Cloud API.
*   **SendGrid / Nodemailer:** For Email Automation.
*   **OpenAI (Optional):** For advanced text analysis.

---

## 🚀 Getting Started

### Prerequisites
*   Node.js v16+
*   MongoDB Atlas Connection String
*   Meta Developer App (for Webhooks)

### Installation

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/your-username/meta-lead-automation.git
    cd meta-lead-automation
    ```

2.  **Install Dependencies**
    ```bash
    # Install Server Deps
    cd server
    npm install

    # Install Client Deps
    cd ../client
    npm install
    ```

3.  **Configure Environment**
    Create a `.env` file in the `/server` directory:
    ```env
    PORT=4000
    MONGO_URI=your_mongodb_connection_string
    JWT_SECRET=your_jwt_secret
    
    # Email (Optional for Dev)
    SMTP_HOST=smtp.gmail.com
    SMTP_USER=your_email
    SMTP_PASS=your_password
    
    # Meta (Optional for Dev)
    FACEBOOK_APP_SECRET=your_secret
    FACEBOOK_PAGE_ACCESS_TOKEN=your_token
    ```

4.  **Run Locally**
    Open two terminals:

    ```bash
    # Terminal 1: Backend (Runs with Nodemon)
    cd server
    npm run dev
    ```

    ```bash
    # Terminal 2: Frontend
    cd client
    npm run dev
    ```

---

## 🧪 Testing (Mock Mode)
You don't need active Facebook Ads to test the system!
We have built-in **Mock Scripts**:

1.  **Verify RPA:** Runs a test script that simulates a "Lead Created" event to trigger your RPA workflows.
    ```bash
    cd server
    node verify_rpa.js
    ```
    *(Check the Server Logs to see the automation executing node-by-node!)*

---

## 📸 Screenshots
*(Add your screenshots here)*

---

**License:** MIT
**Author:** WKPC Team
