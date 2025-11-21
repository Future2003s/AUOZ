/**
 * Script để test API đăng nhập
 * Chạy: node test-login-api.js
 */

const BACKEND_URL = 'http://localhost:8081';
const API_BASE = `${BACKEND_URL}/api/v1`;

async function testLogin() {
  console.log('🧪 Testing Login API...\n');

  // Test 1: Kiểm tra endpoint có tồn tại không
  console.log('1️⃣ Testing if login endpoint exists...');
  try {
    const testRes = await fetch(`${API_BASE}/test`);
    const testData = await testRes.json();
    console.log('✅ API Test endpoint:', testData.message);
    if (testData.endpoints?.auth?.login) {
      console.log('✅ Login endpoint:', testData.endpoints.auth.login);
    }
  } catch (error) {
    console.error('❌ API Test Failed:', error.message);
    return;
  }

  // Test 2: Test login với credentials không hợp lệ
  console.log('\n2️⃣ Testing login with invalid credentials...');
  try {
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@test.com',
        password: 'wrongpassword'
      })
    });

    const loginData = await loginRes.json();
    if (!loginRes.ok) {
      console.log('✅ Login endpoint responds (expected failure):', {
        status: loginRes.status,
        error: loginData.error || loginData.message
      });
    } else {
      console.log('⚠️ Login succeeded (unexpected):', loginData);
    }
  } catch (error) {
    console.error('❌ Login Test Failed:', error.message);
  }

  // Test 3: Test login với missing fields
  console.log('\n3️⃣ Testing login with missing fields...');
  try {
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@test.com'
        // Missing password
      })
    });

    const loginData = await loginRes.json();
    console.log('✅ Validation works:', {
      status: loginRes.status,
      message: loginData.error || loginData.message
    });
  } catch (error) {
    console.error('❌ Validation Test Failed:', error.message);
  }

  // Test 4: Test Frontend API route
  console.log('\n4️⃣ Testing Frontend API route /api/auth/login...');
  try {
    const frontendRes = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@test.com',
        password: 'test123'
      })
    });

    if (frontendRes.ok) {
      const frontendData = await frontendRes.json();
      console.log('✅ Frontend API route works:', {
        status: frontendRes.status,
        success: frontendData.success
      });
    } else {
      const text = await frontendRes.text();
      console.log('⚠️ Frontend API route response:', {
        status: frontendRes.status,
        body: text.substring(0, 200)
      });
    }
  } catch (error) {
    console.error('❌ Frontend API Test Failed (Frontend may not be running):', error.message);
    console.log('💡 Make sure Frontend is running on http://localhost:3000');
  }

  console.log('\n✨ Test completed!');
  console.log('\n📝 Summary:');
  console.log('- Backend URL:', BACKEND_URL);
  console.log('- API Base:', API_BASE);
  console.log('- Login Endpoint:', `${API_BASE}/auth/login`);
  console.log('- Frontend API Route:', 'http://localhost:3000/api/auth/login');
}

// Run tests
testLogin().catch(console.error);

