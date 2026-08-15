const API_URL = 'http://localhost:5000/api';

async function runTests() {
    let studentToken = '';
    let adminToken = '';
    
    try {
        console.log('--- Testing Leaderboard APIs ---');
        
        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: 'student1@example.com', password: 'password123' })
            });
            const data = await res.json();
            if (data.token) {
                studentToken = data.token;
                console.log('Student token acquired.');
            }
        } catch (e) { console.log('Failed to login student1.'); }
        
        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: 'admin@example.com', password: 'password123' })
            });
            const data = await res.json();
            if (data.token) {
                adminToken = data.token;
                console.log('Admin token acquired.');
            }
        } catch (e) { console.log('Failed to login admin.'); }

        if (studentToken) {
            console.log('\n[1] Student Leaderboard Test (GET /api/leaderboard)');
            const stRes = await fetch(`${API_URL}/leaderboard`, {
                headers: { Authorization: `Bearer ${studentToken}` }
            });
            console.log('Student Leaderboard:', await stRes.json());
            
            console.log('\n[2] Security Test: Student attempting to access Admin Leaderboard');
            const secRes = await fetch(`${API_URL}/admin/leaderboard`, {
                headers: { Authorization: `Bearer ${studentToken}` }
            });
            if (secRes.status !== 200) {
                console.log('PASSED: Student blocked. Status:', secRes.status);
            } else {
                console.log('FAILED: Student was able to access admin leaderboard.');
            }
        }

        if (adminToken) {
            console.log('\n[3] Admin Leaderboard Test (GET /api/admin/leaderboard)');
            const adminRes = await fetch(`${API_URL}/admin/leaderboard`, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            console.log('Admin Leaderboard:', await adminRes.json());

            console.log('\n[4] Admin Summary Test (GET /api/admin/leaderboard/summary)');
            const summaryRes = await fetch(`${API_URL}/admin/leaderboard/summary`, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            console.log('Admin Summary:', await summaryRes.json());
        }

        console.log('\n--- Leaderboard Tests Complete ---');
    } catch (err) {
        console.error('Test script error:', err.message);
    }
}

runTests();
