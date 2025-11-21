/**
 * Script để test kết nối API giữa FrontEnd và BackEnd
 * Chạy: node test-api-connection.js
 */

const BACKEND_URL = 'http://localhost:8081';
const API_BASE = `${BACKEND_URL}/api/v1`;

async function testConnection() {
  console.log('🧪 Testing API Connection...\n');

  // Test 1: Health Check
  console.log('1️⃣ Testing Health Check...');
  try {
    const healthRes = await fetch(`${BACKEND_URL}/health`);
    const healthData = await healthRes.json();
    console.log('✅ Health Check:', healthData);
  } catch (error) {
    console.error('❌ Health Check Failed:', error.message);
    return;
  }

  // Test 2: API Test Endpoint
  console.log('\n2️⃣ Testing API Test Endpoint...');
  try {
    const testRes = await fetch(`${API_BASE}/test`);
    const testData = await testRes.json();
    console.log('✅ API Test:', testData);
  } catch (error) {
    console.error('❌ API Test Failed:', error.message);
  }

  // Test 3: CORS Check
  console.log('\n3️⃣ Testing CORS...');
  try {
    const corsRes = await fetch(`${API_BASE}/test`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET',
      }
    });
    console.log('✅ CORS Headers:', {
      'Access-Control-Allow-Origin': corsRes.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': corsRes.headers.get('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Credentials': corsRes.headers.get('Access-Control-Allow-Credentials'),
    });
  } catch (error) {
    console.error('❌ CORS Test Failed:', error.message);
  }

  // Test 4: Products Endpoint (if available)
  console.log('\n4️⃣ Testing Products Endpoint...');
  try {
    const productsRes = await fetch(`${API_BASE}/products?limit=5`);
    if (productsRes.ok) {
      const productsData = await productsRes.json();
      console.log('✅ Products API:', {
        success: productsData.success,
        count: productsData.data?.length || 0,
      });
    } else {
      console.log('⚠️ Products API returned:', productsRes.status, productsRes.statusText);
    }
  } catch (error) {
    console.error('❌ Products Test Failed:', error.message);
  }

  // Test 5: Categories Endpoint
  console.log('\n5️⃣ Testing Categories Endpoint...');
  try {
    const categoriesRes = await fetch(`${API_BASE}/categories`);
    if (categoriesRes.ok) {
      const categoriesData = await categoriesRes.json();
      console.log('✅ Categories API:', {
        success: categoriesData.success,
        count: categoriesData.data?.length || 0,
      });
    } else {
      console.log('⚠️ Categories API returned:', categoriesRes.status, categoriesRes.statusText);
    }
  } catch (error) {
    console.error('❌ Categories Test Failed:', error.message);
  }

  console.log('\n✨ Test completed!');
}

// Run tests
testConnection().catch(console.error);

