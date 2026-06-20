import fetch from 'node-fetch';

async function test() {
  try {
    const res = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'testuser4', password: 'newpassword123' })
    });
    const loginDataText = await res.text();
    console.log("Login user:", res.status, loginDataText);
    
    if (res.ok) {
        const loginData = JSON.parse(loginDataText);
        const res2 = await fetch(`http://localhost:3000/api/admin/users/${loginData.userId}/update-details`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${loginData.customToken}` 
            },
            body: JSON.stringify({ balance: 2000 })
        });
        console.log("Update balance:", res2.status, await res2.text());
    }
  } catch(e) {
    console.error(e);
  }
}
test();
