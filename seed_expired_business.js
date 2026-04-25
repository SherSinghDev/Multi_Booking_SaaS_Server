const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Business = require('./models/Business');

dotenv.config();

const seedExpired = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find a user with role 'admin'
    const user = await User.findOne({ role: 'admin' });
    if (!user) {
      console.log('❌ No admin user found. Please register a user first.');
      process.exit(1);
    }

    console.log(`👤 Found User: ${user.name} (${user.email})`);

    // Create a mock expired business
    const expiredBusiness = {
      owner: user._id,
      businessName: 'Mock Expired Clinic',
      businessType: 'clinic',
      slug: `expired-clinic-${Math.floor(Math.random() * 1000)}`,
      description: 'This is a mock business used to test the renewal flow.',
      phone: '+91 99999 88888',
      address: 'Test Street, Mumbai',
      status: 'expired',
      subscriptionStart: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000), // 35 days ago
      subscriptionEnd: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      paymentAmount: 499
    };

    const business = await Business.create(expiredBusiness);
    console.log('🚀 Created Expired Business:');
    console.log(`   Name: ${business.businessName}`);
    console.log(`   Slug: ${business.slug}`);
    console.log(`   Status: ${business.status}`);
    console.log(`   Expires: ${business.subscriptionEnd.toLocaleDateString()}`);

    console.log('\n✅ Mock data created successfully! You can now log in with the user and test the renewal flow.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
};

seedExpired();
