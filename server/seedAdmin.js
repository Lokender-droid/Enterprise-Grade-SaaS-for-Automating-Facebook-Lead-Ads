const mongoose = require('mongoose');
const config = require('./config');
const Admin = require('./models/Admin');
const logger = require('./utils/logger');

mongoose.connect(config.mongoUri)
    .then(async () => {
        logger.info('Connected to MongoDB');

        const email = config.admin.email || 'admin@example.com';
        const password = config.admin.password || 'admin123';

        try {
            const existing = await Admin.findOne({ email });
            if (existing) {
                logger.info('Admin user already exists');
            } else {
                const admin = new Admin({ email, password });
                await admin.save();
                logger.info(`Admin created: ${email}`);
            }
        } catch (e) {
            logger.error('Error seeding admin', e);
        } finally {
            mongoose.connection.close();
            process.exit();
        }
    })
    .catch(err => {
        logger.error('MongoDB connection error', err);
        process.exit(1);
    });
