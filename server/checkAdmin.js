require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        const count = await Admin.countDocuments();
        const allAdmins = await Admin.find({});
        console.log('All Admins:', allAdmins.map(a => ({ email: a.email, org: a.organizationId })));

        if (admin) {
            console.log('Admin User Found:', admin.email);
            console.log('Admin Password Hash:', admin.password);
            console.log('Organization ID:', admin.organizationId);
        } else {
            console.log('Admin User NOT Found');
        }
        process.exit();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
