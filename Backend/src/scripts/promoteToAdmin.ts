import mongoose from 'mongoose';
import { User } from '../models';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/blog';

async function promoteFirstUserToAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Find the first user
    const user = await User.findOne().sort({ createdAt: 1 });
    
    if (!user) {
      console.log('No users found. Please register a user first.');
      process.exit(1);
    }

    // Check if user is already admin
    if (user.role === 'Admin') {
      console.log(`User ${user.email} is already an Admin.`);
      process.exit(0);
    }

    // Promote to Admin
    user.role = 'Admin';
    await user.save();

    console.log(`✅ Successfully promoted ${user.email} to Admin role.`);
    console.log(`User details:`);
    console.log(`- Name: ${user.firstName} ${user.lastName}`);
    console.log(`- Email: ${user.email}`);
    console.log(`- Role: ${user.role}`);

    process.exit(0);

  } catch (error) {
    console.error('Error promoting user to admin:', error);
    process.exit(1);
  }
}

// Run the script
promoteFirstUserToAdmin();
