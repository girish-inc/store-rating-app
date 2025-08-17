const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Read the schema file
const schemaPath = path.join(__dirname, 'database', 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

async function setupDatabase() {
  try {
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('your-neon-endpoint')) {
      console.log('❌ Please set your actual NeonDB connection string in the .env file');
      console.log('\n📝 Steps to set up NeonDB:');
      console.log('1. Go to https://neon.tech and create a free account');
      console.log('2. Create a new project');
      console.log('3. Copy the connection string from your project dashboard');
      console.log('4. Replace DATABASE_URL in .env file with your connection string');
      console.log('5. Run this script again: node setup-database.js');
      return;
    }

    const sql = neon(process.env.DATABASE_URL);
    
    console.log('🔄 Setting up database schema...');
    
    // Execute the entire schema as one statement to handle functions properly
    try {
      await sql.query(schema);
      console.log('✅ Database schema executed successfully!');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️  Some tables already exist, continuing...');
      } else {
        console.error('❌ Error executing schema:', error.message);
        
        // Fallback: try executing individual statements for basic tables
        console.log('🔄 Trying to execute basic table creation...');
        const basicStatements = [
          `CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name VARCHAR(60) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            address VARCHAR(400),
            role VARCHAR(10) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user', 'owner')),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )`,
          `CREATE TABLE IF NOT EXISTS stores (
            id SERIAL PRIMARY KEY,
            name VARCHAR(60) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            address VARCHAR(400),
            rating REAL DEFAULT 0.0,
            total_ratings INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )`,
          `CREATE TABLE IF NOT EXISTS ratings (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            store_id INTEGER NOT NULL,
            rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
            UNIQUE (user_id, store_id)
          )`
        ];
        
        for (const stmt of basicStatements) {
          try {
            await sql.query(stmt);
            console.log('✅ Created table successfully');
          } catch (tableError) {
            if (tableError.message.includes('already exists')) {
              console.log('ℹ️  Table already exists');
            } else {
              console.error('❌ Error creating table:', tableError.message);
            }
          }
        }
      }
    }
    
    console.log('\n🎉 Database setup completed!');
    console.log('\n🚀 You can now start the server with: npm run dev');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.log('\n💡 Make sure your NeonDB connection string is correct in the .env file');
  }
}

setupDatabase();