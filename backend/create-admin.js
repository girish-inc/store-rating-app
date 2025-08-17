const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcrypt');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function createAdminUser() {
  try {
    console.log('Creating admin user...');
    
    // Hash the password properly
    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    
    const adminResult = await sql`
      INSERT INTO users (name, email, password, address, role) 
      VALUES ('System Administrator', 'admin@storerating.com', ${hashedPassword}, '123 Admin Street', 'admin')
      ON CONFLICT (email) DO UPDATE SET 
        name = EXCLUDED.name,
        password = EXCLUDED.password,
        address = EXCLUDED.address,
        role = EXCLUDED.role
      RETURNING id, name, email, role
    `;
    
    console.log('✅ Admin user created/updated successfully!');
    console.log('Admin Login Details:');
    console.log('Email: admin@storerating.com');
    console.log('Password: Admin123!');
    console.log('Role:', adminResult[0].role);
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  }
}

createAdminUser();