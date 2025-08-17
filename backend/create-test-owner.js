const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcrypt');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function createTestOwnerData() {
  try {
    console.log('Creating test owner data...');
    
    // Create a store owner user
    const hashedPassword = await bcrypt.hash('Owner123!', 10);
    
    const ownerResult = await sql`
      INSERT INTO users (name, email, password, address, role) 
      VALUES ('John Smith', 'owner@teststore.com', ${hashedPassword}, '456 Business Ave', 'owner')
      ON CONFLICT (email) DO UPDATE SET 
        name = EXCLUDED.name,
        password = EXCLUDED.password,
        address = EXCLUDED.address,
        role = EXCLUDED.role
      RETURNING id, name, email, role
    `;
    
    const ownerId = ownerResult[0].id;
    console.log('Created/Updated owner user:', ownerResult[0]);
    
    // Create or update a store for this owner
    const storeResult = await sql`
      INSERT INTO stores (name, email, address, owner_id) 
      VALUES ('Johns Electronics Store', 'contact@johnselectronics.com', '789 Commerce Street', ${ownerId})
      ON CONFLICT (email) DO UPDATE SET 
        name = EXCLUDED.name,
        address = EXCLUDED.address,
        owner_id = EXCLUDED.owner_id
      RETURNING id, name, email, owner_id
    `;
    
    const storeId = storeResult[0].id;
    console.log('Created/Updated store:', storeResult[0]);
    
    // Create some test users for ratings
    const testUsers = [
      { name: 'Alice Johnson', email: 'alice@test.com', address: '123 Test St' },
      { name: 'Bob Wilson', email: 'bob@test.com', address: '456 Demo Ave' },
      { name: 'Carol Davis', email: 'carol@test.com', address: '789 Sample Rd' }
    ];
    
    const userIds = [];
    for (const user of testUsers) {
      const userPassword = await bcrypt.hash('Test123!', 10);
      const userResult = await sql`
        INSERT INTO users (name, email, password, address, role) 
        VALUES (${user.name}, ${user.email}, ${userPassword}, ${user.address}, 'user')
        ON CONFLICT (email) DO UPDATE SET 
          name = EXCLUDED.name,
          password = EXCLUDED.password,
          address = EXCLUDED.address
        RETURNING id
      `;
      userIds.push(userResult[0].id);
    }
    
    console.log('Created/Updated test users:', userIds);
    
    // Create some ratings for the store
    const ratings = [
      { userId: userIds[0], rating: 5 },
      { userId: userIds[1], rating: 4 },
      { userId: userIds[2], rating: 5 }
    ];
    
    for (const rating of ratings) {
      await sql`
        INSERT INTO ratings (user_id, store_id, rating) 
        VALUES (${rating.userId}, ${storeId}, ${rating.rating})
        ON CONFLICT (user_id, store_id) DO UPDATE SET 
          rating = EXCLUDED.rating,
          updated_at = CURRENT_TIMESTAMP
      `;
    }
    
    console.log('Created/Updated ratings for the store');
    
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
    
    console.log('Updated store statistics:', avgRating[0]);
    
    console.log('\n=== Test Data Created Successfully ===');
    console.log('Owner Login: owner@teststore.com / Owner123!');
    console.log('Store: Johns Electronics Store');
    console.log('Average Rating:', avgRating[0].avg_rating);
    console.log('Total Ratings:', avgRating[0].total_ratings);
    
  } catch (error) {
    console.error('Error creating test data:', error);
  }
}

createTestOwnerData();