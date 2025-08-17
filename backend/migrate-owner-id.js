const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

(async () => {
  try {
    // Add owner_id column to stores table
    await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS owner_id INTEGER`;
    console.log('Added owner_id column to stores table');
    
    // Add foreign key constraint (skip if already exists)
    try {
      await sql`ALTER TABLE stores ADD CONSTRAINT fk_stores_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL`;
      console.log('Added foreign key constraint for owner_id');
    } catch (constraintError) {
      if (constraintError.code === '42710') {
        console.log('Foreign key constraint already exists, skipping');
      } else {
        throw constraintError;
      }
    }
    
    console.log('Successfully migrated stores table with owner_id column');
  } catch (error) {
    console.error('Migration error:', error);
  }
})();