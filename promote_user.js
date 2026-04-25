const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load User model
const User = require('./models/User');

// Load env
dotenv.config();

const promoteUser = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/bookify';
    console.log(`Connecting to: ${mongoUri}`);
    
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const email = 'ss@gmail.com';
    const user = await User.findOneAndUpdate(
      { email },
      { role: 'super-admin' },
      { new: true }
    );

    if (user) {
      console.log(`Success! User ${user.name} (${user.email}) is now a super-admin.`);
    } else {
      console.log(`User with email ${email} not found.`);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Promotion failed:', error);
    process.exit(1);
  }
};

promoteUser();
