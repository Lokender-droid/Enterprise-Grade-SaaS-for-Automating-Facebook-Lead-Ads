const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const morgan = require('morgan');
const config = require('./config');
const path = require('path');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');

// Import Routes
const webhookRoutes = require('./routes/webhook');
const leadRoutes = require('./routes/leadRoutes');
const authRoutes = require('./routes/authRoutes');
const organizationRoutes = require('./routes/organizationRoutes');
const teamRoutes = require('./routes/teamRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const ssoRoutes = require('./routes/ssoRoutes');

// Initialize Passport
const passport = require('./config/passport-setup');

// Initialize App
const app = express();
const server = http.createServer(app);

// Socket.IO Setup
const io = new Server(server, {
    cors: {
        origin: '*', // Allow all origins for simplicity, tighten in production
        methods: ['GET', 'POST']
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Initialize Passport
app.use(passport.initialize());

// Security Middleware
app.use(helmet()); // Secure HTTP headers
app.use(mongoSanitize()); // Prevent NoSQL injection
app.use(xss()); // Prevent XSS attacks

// Rate Limiting
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // Limit each IP to 100 requests per windowMs
});
app.use('/leads', globalLimiter);

const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 1000, // Increased for development/testing
    message: 'Too many login attempts from this IP, please try again after an hour'
});
app.use('/auth', authLimiter);

const webhookLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 60 // Allow high throughput for Facebook webhooks
});
app.use('/webhook', webhookLimiter);

// Database Connection
mongoose.connect(config.mongoUri)
    .then(() => console.log('MongoDB Connected Successfully'))
    .catch(err => {
        console.error('MongoDB Connection FAILED:', err.message);
        console.error('Please check your IP Whitelist in MongoDB Atlas!');
        process.exit(1);
    });

// Make io available in routes via request object
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Routes
app.use('/api/webhook', webhookRoutes);
app.use('/api/leads', leadRoutes);
app.use('/auth', authRoutes);
app.use('/api/organization', organizationRoutes); // Fixed: was /organization, now /api/organization
app.use('/api/team', teamRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/ai', require('./routes/aiRoutes')); // AI Chatbot Route
app.use('/api/enterprise', require('./routes/enterpriseRoutes')); // New Audit/Notification Route
app.use('/api/workflows', require('./routes/workflowRoutes')); // RPA Workflow Route
app.use('/users', require('./routes/users'));
app.use('/auth', ssoRoutes); // SSO OAuth Routes

// Serve Assets (Brochure)
app.use('/assets', express.static(path.join(__dirname, '../assets')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Basic Health Check
app.get('/', (req, res) => {
    res.send('Meta Lead Automation Server is Running');
});

// Socket Connection
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Start Server
server.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
});
