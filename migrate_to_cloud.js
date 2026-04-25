const mongoose = require('mongoose');

const LOCAL_URI = 'mongodb://localhost:27017/bookify';
const REMOTE_URI = 'mongodb+srv://shersingh741730_db_user:5JUYcl9E1KxrXAM5@cluster0.ma4tnzs.mongodb.net/bookify?appName=Cluster0';

const migrate = async () => {
  try {
    console.log('📡 Connecting to LOCAL database...');
    const localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
    console.log('✅ Connected to LOCAL');

    console.log('📡 Connecting to REMOTE database...');
    const remoteConn = await mongoose.createConnection(REMOTE_URI).asPromise();
    console.log('✅ Connected to REMOTE');

    const collections = await localConn.db.listCollections().toArray();
    
    for (const col of collections) {
      const collectionName = col.name;
      console.log(`\n📦 Migrating collection: ${collectionName}...`);
      
      const data = await localConn.db.collection(collectionName).find({}).toArray();
      
      if (data.length > 0) {
        console.log(`   Found ${data.length} documents. Transferring...`);
        
        // Clean data if needed (removing _id if conflict arises, but usually keep for relations)
        // We'll try to insert with original IDs to maintain relations
        try {
          await remoteConn.db.collection(collectionName).insertMany(data, { ordered: false });
          console.log(`   ✅ Migration complete for ${collectionName}`);
        } catch (err) {
          if (err.code === 11000) {
            console.log(`   ⚠️ Some documents already exist in remote ${collectionName}. Skipped duplicates.`);
          } else {
            console.error(`   ❌ Error inserting into ${collectionName}:`, err.message);
          }
        }
      } else {
        console.log(`   ℹ️ Collection ${collectionName} is empty. Skipping.`);
      }
    }

    console.log('\n✨ ALL MIGRATIONS FINISHED');
    
    await localConn.close();
    await remoteConn.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

migrate();
