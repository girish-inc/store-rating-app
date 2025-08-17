const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcrypt');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function createMultipleTestStores() {
  try {
    console.log('Creating multiple test stores for sorting functionality...');
    
    // Create multiple store owners
    const storeOwners = [
      { name: 'Alice Brown', email: 'alice@brownstore.com', address: '100 First Street', storeName: 'Alice\'s Grocery', storeEmail: 'info@alicegrocery.com', storeAddress: '100 First Street' },
      { name: 'Bob Green', email: 'bob@greentech.com', address: '200 Second Avenue', storeName: 'Green Tech Solutions', storeEmail: 'contact@greentech.com', storeAddress: '200 Second Avenue' },
      { name: 'Carol White', email: 'carol@whitebooks.com', address: '300 Third Boulevard', storeName: 'White\'s Bookstore', storeEmail: 'hello@whitebooks.com', storeAddress: '300 Third Boulevard' },
      { name: 'David Black', email: 'david@blackcafe.com', address: '400 Fourth Lane', storeName: 'Black Coffee Cafe', storeEmail: 'orders@blackcafe.com', storeAddress: '400 Fourth Lane' },
      { name: 'Eva Red', email: 'eva@redflowers.com', address: '500 Fifth Road', storeName: 'Red Rose Flowers', storeEmail: 'eva@redflowers.com', storeAddress: '500 Fifth Road' }
    ];
    
    const hashedPassword = await bcrypt.hash('Owner123!', 10);
    
    for (const owner of storeOwners) {
      // Create owner user
      const ownerResult = await sql`
        INSERT INTO users (name, email, password, address, role) 
        VALUES (${owner.name}, ${owner.email}, ${hashedPassword}, ${owner.address}, 'owner')
        ON CONFLICT (email) DO UPDATE SET 
          name = EXCLUDED.name,
          password = EXCLUDED.password,
          address = EXCLUDED.address,
          role = EXCLUDED.role
        RETURNING id, name, email, role
      `;
      
      const ownerId = ownerResult[0].id;
      console.log('Created/Updated owner:', ownerResult[0]);
      
      // Create store for this owner
      const storeResult = await sql`
        INSERT INTO stores (name, email, address, owner_id) 
        VALUES (${owner.storeName}, ${owner.storeEmail}, ${owner.storeAddress}, ${ownerId})
        ON CONFLICT (email) DO UPDATE SET 
          name = EXCLUDED.name,
          address = EXCLUDED.address,
          owner_id = EXCLUDED.owner_id
        RETURNING id, name, email, owner_id
      `;
      
      const storeId = storeResult[0].id;
      console.log('Created/Updated store:', storeResult[0]);
      
      // Create some random ratings for each store
      const ratingValues = [
        [5, 4, 5, 3], // Alice's Grocery - avg 4.25
        [3, 2, 4, 3], // Green Tech - avg 3.0
        [5, 5, 4, 5], // White's Bookstore - avg 4.75
        [2, 3, 2, 1], // Black Coffee - avg 2.0
        [4, 5, 5, 4]  // Red Rose - avg 4.5
      ];
      
      const storeIndex = storeOwners.indexOf(owner);
      const ratings = ratingValues[storeIndex];
      
      // Create test users for ratings if they don't exist
      const testUserEmails = ['user1@test.com', 'user2@test.com', 'user3@test.com', 'user4@test.com'];
      const userPassword = await bcrypt.hash('Test123!', 10);
      
      for (let i = 0; i < testUserEmails.length; i++) {
        const userResult = await sql`
          INSERT INTO users (name, email, password, address, role) 
          VALUES (${`Test User ${i + 1}`}, ${testUserEmails[i]}, ${userPassword}, ${`${100 + i} Test Street`}, 'user')
          ON CONFLICT (email) DO UPDATE SET 
            name = EXCLUDED.name
          RETURNING id
        `;
        
        const userId = userResult[0].id;
        
        // Add rating for this store
        await sql`
          INSERT INTO ratings (user_id, store_id, rating) 
          VALUES (${userId}, ${storeId}, ${ratings[i]})
          ON CONFLICT (user_id, store_id) DO UPDATE SET 
            rating = EXCLUDED.rating,
            updated_at = CURRENT_TIMESTAMP
        `;
      }
      
      // Update store rating statistics
      const avgRating = await sql`
        SELECT AVG(rating)::REAL as avg_rating, COUNT(*)::INTEGER as total_ratings
        FROM ratings 
        WHERE store_id = ${storeId}
      `;
      
      await sql`
        UPDATE stores 
        SET rating = ${avgRating[0].avg_rating}, total_ratings = ${avgRating[0].total_ratings}
        WHERE id = ${storeId}
      `;
      
      console.log(`Updated ${owner.storeName} statistics:`, avgRating[0]);
    }
    
    console.log('\n=== Multiple Test Stores Created Successfully ===');
    console.log('Stores created with different names, addresses, and ratings for testing sort functionality');
    
  } catch (error) {
    console.error('Error creating multiple test stores:', error);
  }
}

createMultipleTestStores();