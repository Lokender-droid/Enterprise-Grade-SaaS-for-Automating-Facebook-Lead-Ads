<<<<<<< HEAD
# 🚀 Enterprise Lead Automation SaaS

[![Production Ready](https://img.shields.io/badge/Production-Ready-brightgreen)]()
[![Security](https://img.shields.io/badge/Security-95%25-green)]()
[![License](https://img.shields.io/badge/License-MIT-blue)]()

Enterprise-grade SaaS platform for automating Facebook Lead Ads with AI-powered features, multi-channel communication, and white-labeling capabilities.

## ✨ Key Features

### Core Functionality
- ✅ **Facebook Lead Ads Integration** - Real-time lead capture via webhooks
- ✅ **Multi-Channel Communication** - Email (SendGrid) + WhatsApp (Meta API)
- ✅ **AI-Powered Lead Scoring** - OpenAI integration for intelligent lead qualification
- ✅ **Voice Agent Calls** - Vapi.ai integration for automated voice follow-ups
- ✅ **Deal Pipeline Management** - Kanban board with custom fields
- ✅ **Real-Time Dashboard** - Socket.IO powered live updates

### Enterprise Features
- 🔐 **Advanced 2FA** - TOTP, Email, SMS verification with backup codes
- 🔒 **API Key Encryption** - AES-256-GCM encryption at rest
- 🌐 **White-Label Branding** - Custom domain + DNS verification + logo upload
- 📊 **Audit Logging** - Immutable activity tracking for compliance
- 🎚️ **Feature Flags** - Granular control per organization
- 👥 **SSO Integration** - Google & Microsoft OAuth

## 🛡️ Security

- **AES-256-GCM** encryption for sensitive API keys
- **Two-Factor Authentication** (TOTP/Email/SMS)
- **Rate limiting** & brute force protection
- **JWT** authentication with secure tokens
- **Bcrypt** password hashing
- **Comprehensive audit logs**

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- MongoDB 5+
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Lokender-droid/enterprise-lead-automation-saas.git
cd enterprise-lead-automation-saas
```

2. **Install dependencies**
```bash
# Server
cd server
npm install

# Client
cd ../client
npm install
```

3. **Environment Setup**
```bash
cd server
cp .env.example .env
# Edit .env with your configuration
```

4. **Generate Encryption Key**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Add output to ENCRYPTION_KEY in .env
```

5. **Start Development Servers**
```bash
# Terminal 1 - Backend
cd server
npm start

# Terminal 2 - Frontend
cd client
npm run dev
```

## 📚 Tech Stack

### Backend
- **Runtime**: Node.js + Express
- **Database**: MongoDB + Mongoose
- **Authentication**: JWT + Passport.js
- **Real-time**: Socket.IO
- **Security**: Helmet, CORS, bcrypt, crypto

### Frontend
- **Framework**: React + Vite
- **Routing**: React Router v6
- **State**: React Hooks
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

### Integrations
- **Meta API** - Lead Ads & WhatsApp
- **OpenAI** - AI lead scoring
- **Vapi.ai** - Voice agent calls
- **SendGrid** - Email delivery
- **Twilio** - SMS for 2FA

## 📖 Documentation

- [2FA Setup Guide](./docs/2FA_SETUP.md)
- [DNS Verification](./docs/DNS_VERIFICATION.md)
- [API Documentation](./docs/API.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)

## 🔐 Security Best Practices

1. **Never commit `.env` files**
2. **Rotate encryption keys** periodically
3. **Enable 2FA** for all admin accounts
4. **Regular security audits**
5. **Monitor audit logs**

## 🎯 Production Checklist

- [ ] Set `ENCRYPTION_KEY` in production .env
- [ ] Configure MongoDB Atlas with replica set
- [ ] Set up SSL certificates (Let's Encrypt)
- [ ] Add error tracking (Sentry)
- [ ] Configure automated backups
- [ ] Set up monitoring (Uptime Robot)
- [ ] Implement CI/CD pipeline

## 📊 Features

| Feature | Status | Notes |
|---------|--------|-------|
| Lead Capture | ✅ | Webhook + real-time |
| AI Scoring | ✅ | OpenAI GPT-4 |
| 2FA | ✅ | TOTP + Email + SMS |
| API Encryption | ✅ | AES-256-GCM |
| DNS Verification | ✅ | Multi-resolver |
| White-Labeling | ✅ | Domain + Logo |
| Audit Logs | ✅ | Immutable tracking |

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) first.

## 📄 License

This project is licensed under the MIT License - see [LICENSE](./LICENSE) file.

## 🙏 Acknowledgments

Built with enterprise-grade security and scalability in mind.

---

**⭐ Star this repo if you find it useful!**
=======
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
>>>>>>> 46429a05d252eab9ad9e75d9fdfa1a3356ceed19
