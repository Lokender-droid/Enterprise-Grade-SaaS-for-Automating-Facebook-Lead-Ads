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
