const fs = require('fs');

async function testSeededData() {
    const baseUrl = 'http://localhost:3000/api';
    
    const studentEmail = `student_seed_${Date.now()}@test.com`;
    await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Student', email: studentEmail, password: 'password' })
    });
    const stuLoginRes = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: studentEmail, password: 'password' })
    });
    const loginData = await stuLoginRes.json();
    if (!loginData.success) {
        console.error('Login Failed:', loginData);
        process.exit(1);
    }
    const token = loginData.data.token;
    console.log('✔ Authenticated as student.');

    // 1. GET /api/quizzes
    const qListRes = await fetch(`${baseUrl}/quizzes`, { headers: { 'Authorization': `Bearer ${token}` } });
    const qListData = await qListRes.json();
    console.log(`GET /api/quizzes -> Count: ${qListData.data.length}`);
    if (qListData.data.length !== 25) throw new Error('Expected 25 quizzes');
    
    const quizId = qListData.data[0].id;
    
    // 2. GET /api/quizzes/:id
    const qDetailRes = await fetch(`${baseUrl}/quizzes/${quizId}`, { headers: { 'Authorization': `Bearer ${token}` } });
    const qDetailData = await qDetailRes.json();
    console.log(`GET /api/quizzes/${quizId} -> Title: ${qDetailData.data.title}`);
    
    // 3. GET /api/quizzes/:id/questions
    const qQuestionsRes = await fetch(`${baseUrl}/quizzes/${quizId}/questions`, { headers: { 'Authorization': `Bearer ${token}` } });
    const qQuestionsData = await qQuestionsRes.json();
    console.log(`GET /api/quizzes/${quizId}/questions -> Count: ${qQuestionsData.data.length}`);
    if (qQuestionsData.data.length !== 4) throw new Error('Expected 4 questions');
    
    // Verify correctAnswer is hidden
    
    // Use existing token
    const stuQuesRes = await fetch(`${baseUrl}/quizzes/${quizId}/questions`, { headers: { 'Authorization': `Bearer ${token}` } });
    const stuQuesData = await stuQuesRes.json();
    
    if (stuQuesData.data[0].correctAnswer) {
        throw new Error('SECURITY LEAK: correctAnswer exposed to student!');
    }
    
    console.log(`Student Question 1 Data:`, JSON.stringify(stuQuesData.data[0]));
    console.log('✔ Verified: correctAnswer is HIDDEN from student API.');
    
    console.log('\nAll API verifications passed successfully!');
}

testSeededData().catch(console.error);
