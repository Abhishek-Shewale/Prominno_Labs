require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../src/models/Admin.model');
const { hashPassword } = require('../src/utils/hash.util');
const connectDB = require('../src/config/db');

const seedAdmin = async () => {
    try {
        await connectDB();

        const adminEmail = 'admin@prominno.com';
        const existingAdmin = await Admin.findOne({ email: adminEmail });

        if (existingAdmin) {
            console.log('Admin already exists.');
        } else {
            const hashedPassword = await hashPassword('Admin@123');
            
            await Admin.create({
                name: 'Super Admin',
                email: adminEmail,
                password: hashedPassword,
                role: 'admin'
            });

            console.log('Default admin created:');
            console.log(`Email: ${adminEmail}`);
            console.log(`Password: Admin@123`);
        }

        process.exit(0);
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
};

seedAdmin();
