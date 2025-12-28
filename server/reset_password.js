const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const config = require('./config.js');

const resetPassword = async () => {
    try {
        mongoose.set('strictQuery', false);
        await mongoose.connect(config.mongoUri);
        console.log('Connected to MongoDB');

        const email = 'admin@example.com';
        const newPassword = 'password123';

        const user = await Admin.findOne({ email });

        if (!user) {
            console.log(`User with email ${email} NOT FOUND.`);
            process.exit(1);
        }

        // Update password
        user.password = newPassword;

        // Reset lockout fields just in case
        user.loginAttempts = 0;
        user.lockUntil = undefined;

        // Save triggers the pre('save') hook which hashes the password
        await user.save();

        console.log(`Password for ${email} has been successfully reset to: ${newPassword}`);
        console.log('Login attempts reset to 0.');
        console.log('Account unlocked.');

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error resetting password:', error);
        process.exit(1);
    }
};

resetPassword();
