// Test verify-batch from browser console
// Copy-paste this into browser DevTools console

async function testVerifyBatch() {
  const SUPABASE_URL = 'https://udnpbqtvbnepicwyubnm.supabase.co';
  const ANON_KEY = 'your_supabase_anon_key';

  console.log('ðŸ§ª Testing verify-batch Edge Function...\n');

  // Test 1: OPTIONS (CORS preflight)
  console.log('1ï¸âƒ£ Testing OPTIONS (CORS)...');
  try {
    const optionsRes = await fetch(`${SUPABASE_URL}/functions/v1/verify-batch`, {
      method: 'OPTIONS',
      headers: { 'apikey': ANON_KEY }
    });
    console.log(`âœ… OPTIONS: ${optionsRes.status} ${optionsRes.statusText}`);
  } catch (err) {
    console.error('âŒ OPTIONS failed:', err.message);
  }

  // Test 2: Valid NFT (should exist in DB)
  console.log('\n2ï¸âƒ£ Testing POST with valid NFT...');
  try {
    const validRes = await fetch(`${SUPABASE_URL}/functions/v1/verify-batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': ANON_KEY
      },
      body: JSON.stringify({
        tokenId: '0.0.7161809',
        serialNumber: 1
      })
    });
    const validData = await validRes.json();
    console.log(`Status: ${validRes.status}`);
    console.log('Response:', validData);
    
    if (validRes.ok) {
      console.log('âœ… Valid NFT verified successfully');
    } else if (validRes.status === 404 && validData.stage === 'database_query') {
      console.log('âš ï¸ NFT not found (404 business logic - expected if not in DB)');
    } else {
      console.error('âŒ Unexpected response');
    }
  } catch (err) {
    console.error('âŒ Valid NFT test failed:', err.message);
  }

  // Test 3: Invalid payload
  console.log('\n3ï¸âƒ£ Testing POST with invalid payload...');
  try {
    const invalidRes = await fetch(`${SUPABASE_URL}/functions/v1/verify-batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': ANON_KEY
      },
      body: JSON.stringify({})
    });
    const invalidData = await invalidRes.json();
    console.log(`Status: ${invalidRes.status}`);
    console.log('Response:', invalidData);
    
    if (invalidRes.status === 400 && invalidData.stage === 'validation') {
      console.log('âœ… Invalid payload rejected correctly');
    } else {
      console.error('âŒ Expected 400 validation error');
    }
  } catch (err) {
    console.error('âŒ Invalid payload test failed:', err.message);
  }

  // Test 4: Missing apikey header
  console.log('\n4ï¸âƒ£ Testing POST without apikey header...');
  try {
    const noKeyRes = await fetch(`${SUPABASE_URL}/functions/v1/verify-batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tokenId: '0.0.7161809',
        serialNumber: 1
      })
    });
    const noKeyData = await noKeyRes.json();
    console.log(`Status: ${noKeyRes.status}`);
    console.log('Response:', noKeyData);
    
    if (noKeyRes.status === 401) {
      console.log('âœ… Missing apikey rejected correctly (401)');
    } else {
      console.error('âŒ Expected 401 unauthorized');
    }
  } catch (err) {
    console.error('âŒ No apikey test failed:', err.message);
  }

  console.log('\nâœ… All tests completed!');
}

// Run tests
testVerifyBatch();
