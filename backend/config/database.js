const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

// NeonDB connection string
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required for NeonDB connection');
}

// Create NeonDB connection
const sql = neon(DATABASE_URL);

// Test connection function
const testConnection = async () => {
  try {
    const result = await sql`SELECT version()`;
    console.log('Database connected successfully to NeonDB');
    console.log('PostgreSQL version:', result[0].version);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    return false;
  }
};

// Execute query function
const executeQuery = async (query, params = []) => {
  try {
    // For NeonDB, we use template literals for parameterized queries
    // This is a simplified approach - in production, consider using a query builder
    let processedQuery = query;
    if (params && params.length > 0) {
      // Replace ? placeholders with $1, $2, etc. for PostgreSQL
      let paramIndex = 1;
      processedQuery = query.replace(/\?/g, () => `$${paramIndex++}`);
    }
    
    const results = await sql.query(processedQuery, params);
    return results;
  } catch (error) {
    console.error('Query execution failed:', error.message);
    throw error;
  }
};

module.exports = {
  sql,
  testConnection,
  executeQuery
};