const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const config = require('./config.js');

const checkUser = async () => {
    try {
        mongoose.set('strictQuery', false);
        await mongoose.connect(config.mongoUri);
        console.log('Connected to MongoDB');

        const email = 'admin@example.com';
        const user = await Admin.findOne({ email }).select('+password');

        if (!user) {
            console.log(`User with email ${email} NOT FOUND in DB.`);
        } else {
            console.log(`User found in DB:`);
            const pwd = user.password;
            const isHashed = pwd && pwd.startsWith('$2');
            console.log(`- Password exists: ${!!pwd}`);
            console.log(`- Password length: ${pwd ? pwd.length : 0}`);
            console.log(`- Password starts with: ${pwd ? pwd.substring(0, 7) + '...' : 'N/A'}`);
            console.log(`- Looks like Bcrypt hash: ${isHashed}`);

            if (!isHashed && pwd) {
                console.log("WARNING: Password does not look like a bcrypt hash. It might be stored as plain text, which will cause login to fail.");
            }
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error checking user:', error);
        process.exit(1);
    }
};

checkUser();
