// ALN-8: creates the platform admin account.
// Admins cannot register through the app; this script is the only way to create one.

const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
const User = require('../models/User');

const run = async () => {
    const { MONGO_URI, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
    if (!MONGO_URI || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
        console.error('Set MONGO_URI, ADMIN_EMAIL and ADMIN_PASSWORD in backend/.env first.');
        process.exit(1);
    }

    await mongoose.connect(MONGO_URI);

    const existing = await User.findOne({ email: ADMIN_EMAIL });
    if (existing) {
        existing.role = 'admin';
        existing.verificationStatus = 'approved';
        await existing.save();
        console.log(`Existing user ${ADMIN_EMAIL} is now an admin.`);
    } else {
        await User.create({
            name: 'Platform Admin',
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            role: 'admin',
            verificationStatus: 'approved',
        });
        console.log(`Admin account ${ADMIN_EMAIL} created.`);
    }

    await mongoose.disconnect();
};

run().catch((error) => {
    console.error('Seeding failed:', error.message);
    process.exit(1);
});