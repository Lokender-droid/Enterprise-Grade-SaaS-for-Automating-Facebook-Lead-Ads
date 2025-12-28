require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const Organization = require('./models/Organization');

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        const email = 'admin@example.com';
        const password = 'admin123';

        let org = await Organization.findOne({ name: 'Default Company' });
        if (!org) {
            org = await Organization.findOne({}); // Fallback to any org
        }

        if (!org) {
            console.error('No Organization found! Cannot create admin.');
            process.exit(1);
        }

        const existing = await Admin.findOne({ email });
        if (existing) {
            console.log('User admin@example.com already exists. Resetting password...');
            existing.password = password;
            existing.organizationId = org._id;
            await existing.save();
            console.log('Password reset to admin123');
        } else {
            await Admin.create({
                name: 'Default Admin',
                email,
                password,
                role: 'admin',
                organizationId: org._id
            });
            console.log(`Created user: ${email} / ${password} assigned to Org: ${org.name}`);
        }
        process.exit();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
