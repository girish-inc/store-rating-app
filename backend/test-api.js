const axios = require('axios');
require('dotenv').config();

async function testOwnerAPI() {
  try {
    console.log('Testing Owner API endpoints...');
    
    // First, login as owner
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'owner@teststore.com',
      password: 'Owner123!'
    });
    
    console.log('Login successful:', loginResponse.data.user);
    const token = loginResponse.data.token;
    
    // Test dashboard endpoint
    const dashboardResponse = await axios.get('http://localhost:5000/api/owner/dashboard', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Dashboard response:', JSON.stringify(dashboardResponse.data, null, 2));
    
    // Test analytics endpoint
    const analyticsResponse = await axios.get('http://localhost:5000/api/owner/analytics?period=30', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Analytics response:', JSON.stringify(analyticsResponse.data, null, 2));
    
  } catch (error) {
    console.error('API Test Error:', error.response?.data || error.message);
  }
}

testOwnerAPI();