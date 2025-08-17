const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function checkData() {
  try {
    console.log('Checking database data...');
    
    // Check stores for owner 9
    const stores = await sql`SELECT id, name, owner_id, rating, total_ratings FROM stores WHERE owner_id = 9`;
    console.log('Stores for owner 9:', stores);
    
    // Check ratings for store 9
    const ratings = await sql`SELECT COUNT(*) as count, AVG(rating) as avg FROM ratings WHERE store_id = 9`;
    console.log('Ratings for store 9:', ratings);
    
    // Check all ratings for store 9
    const allRatings = await sql`SELECT * FROM ratings WHERE store_id = 9`;
    console.log('All ratings for store 9:', allRatings);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkData();