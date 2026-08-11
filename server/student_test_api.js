const fs = require('fs');

async function runStudentTests() {
    console.log('--- STARTING STUDENT API TESTS ---');
    const baseUrl = 'http://localhost:3000/api';
    
    // 1. Login Admin to create a quiz and questions
    console.log('\n[SETUP] 1. Login Admin...');
    const adminLoginRes = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin123@gmail.com', password: '12345' })
    });
    const adminLoginData = await adminLoginRes.json();
    if (!adminLoginData.success) throw new Error('Admin login failed: ' + JSON.stringify(adminLoginData));
    const adminToken = adminLoginData.data.token;
    console.log('✔ Admin token acquired.');

    console.log('\n[SETUP] 2. Create Quiz and Question...');
    const createQuizRes = await fetch(`${baseUrl}/quizzes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
        body: JSON.stringify({ title: 'Student Test Quiz', duration: 15, totalMarks: 10 })
    });
    const quizData = await createQuizRes.json();
    const quizId = quizData.data.id;
    
    const createQuestionRes = await fetch(`${baseUrl}/quizzes/${quizId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
        body: JSON.stringify({
            questionText: 'What is the color of the sky?', optionA: 'Blue', optionB: 'Red', optionC: 'Green', optionD: 'Yellow', correctAnswer: 'A', marks: 10
        })
    });
    const questionData = await createQuestionRes.json();
    const questionId = questionData.data.id;
    console.log(`✔ Quiz ID: ${quizId}, Question ID: ${questionId}`);


    // 3. Register & Login Student
    console.log('\n1. Register & Login Student...');
    const studentEmail = `student${Date.now()}@test.com`;
    await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test Student', email: studentEmail, password: 'password123' })
    });
    
    const studentLoginRes = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: studentEmail, password: 'password123' })
    });
    const studentLoginData = await studentLoginRes.json();
    const studentToken = studentLoginData.data.token;
    console.log('✔ Student registered and logged in.');


    // 4. GET /api/auth/me
    console.log('\n2. GET /api/auth/me (Profile)...');
    const meRes = await fetch(`${baseUrl}/auth/me`, {
        headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const meData = await meRes.json();
    if (!meData.success || meData.data.password || meData.data.email !== studentEmail) throw new Error('Profile fetch failed or leaked password.');
    console.log('✔ Profile fetched safely.');


    // 5. Browse Quizzes & Details
    console.log('\n3. GET /api/quizzes & /api/quizzes/:id ...');
    const qListRes = await fetch(`${baseUrl}/quizzes`, { headers: { 'Authorization': `Bearer ${studentToken}` } });
    if (!(await qListRes.json()).success) throw new Error('Failed to get quizzes list');
    
    const qDetailRes = await fetch(`${baseUrl}/quizzes/${quizId}`, { headers: { 'Authorization': `Bearer ${studentToken}` } });
    if (!(await qDetailRes.json()).success) throw new Error('Failed to get quiz details');
    console.log('✔ Quizzes browsed successfully.');


    // 6. GET /api/quizzes/:quizId/questions (Ensure NO correctAnswer)
    console.log('\n4. GET questions (Verify no answer key leak)...');
    const stuQuestionsRes = await fetch(`${baseUrl}/quizzes/${quizId}/questions`, { headers: { 'Authorization': `Bearer ${studentToken}` } });
    const stuQuestionsData = await stuQuestionsRes.json();
    if (stuQuestionsData.data[0].correctAnswer) throw new Error('SECURITY LEAK: correct answers exposed to student!');
    console.log('✔ Questions fetched securely. Answer key is hidden.');


    // 7. Start Attempt
    console.log('\n5. Start Quiz Attempt...');
    const startRes = await fetch(`${baseUrl}/attempts/start/${quizId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const startData = await startRes.json();
    if (!startData.success) throw new Error('Failed to start attempt: ' + startData.message);
    const attemptId = startData.data.attemptId;
    console.log(`✔ Attempt started successfully. Attempt ID: ${attemptId}`);


    // 8. Try to Review early (Should be blocked)
    console.log('\n6. Try to Review before submitting (Should fail)...');
    const earlyReviewRes = await fetch(`${baseUrl}/attempts/${attemptId}/review`, { headers: { 'Authorization': `Bearer ${studentToken}` } });
    const earlyReviewData = await earlyReviewRes.json();
    if (earlyReviewData.success) throw new Error('SECURITY LEAK: Allowed to review unfinished attempt!');
    console.log('✔ Early review securely blocked.');


    // 9. Submit Quiz
    console.log('\n7. Submit Quiz Attempt...');
    const submitRes = await fetch(`${baseUrl}/attempts/${attemptId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${studentToken}` },
        body: JSON.stringify({
            answers: [ { questionId: questionId, selectedAnswer: 'A' } ] // Correct answer
        })
    });
    const submitData = await submitRes.json();
    if (!submitData.success || submitData.data.score !== 10) throw new Error('Submit failed or score incorrect');
    console.log('✔ Attempt submitted. Score officially calculated on backend.');


    // 10. Review Attempt
    console.log('\n8. Review Answers (After submission)...');
    const reviewRes = await fetch(`${baseUrl}/attempts/${attemptId}/review`, { headers: { 'Authorization': `Bearer ${studentToken}` } });
    const reviewData = await reviewRes.json();
    if (!reviewData.success || !reviewData.data.answers[0].correctAnswer) throw new Error('Review failed or missing correct answer data.');
    console.log('✔ Reviewed successfully. Answers populated.');


    // 11. My Attempts
    console.log('\n9. Get My Attempts...');
    const myAttRes = await fetch(`${baseUrl}/attempts/my`, { headers: { 'Authorization': `Bearer ${studentToken}` } });
    const myAttData = await myAttRes.json();
    if (!myAttData.success || myAttData.data.length !== 1) throw new Error('Failed to get my attempts properly.');
    console.log('✔ My attempts fetched.');


    // 12. Attempt 2
    console.log('\n10. Start Second Attempt (Should succeed)...');
    const start2Res = await fetch(`${baseUrl}/attempts/start/${quizId}`, { method: 'POST', headers: { 'Authorization': `Bearer ${studentToken}` } });
    const start2Data = await start2Res.json();
    if (!start2Data.success || start2Data.data.attemptNumber !== 2) {
        console.error('Start2 Failed with:', start2Data);
        throw new Error('Failed to start Attempt 2');
    }
    console.log('✔ Attempt 2 started. AttemptNumber:', start2Data.data.attemptNumber);
    
    console.log('\n11. Submit Attempt 2...');
    await fetch(`${baseUrl}/attempts/${start2Data.data.attemptId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${studentToken}` },
        body: JSON.stringify({ answers: [] })
    });
    console.log('✔ Attempt 2 submitted.');
    
    // 13. Attempt 3
    console.log('\n12. Start Third Attempt (Should fail with 409)...');
    const start3Res = await fetch(`${baseUrl}/attempts/start/${quizId}`, { method: 'POST', headers: { 'Authorization': `Bearer ${studentToken}` } });
    if (start3Res.status !== 409) throw new Error('Attempt 3 did not return 409 Conflict!');
    const start3Data = await start3Res.json();
    if (start3Data.success) throw new Error('Attempt 3 allowed incorrectly!');
    console.log('✔ Attempt 3 securely blocked (409).');
    
    // 14. Quiz Details verification
    const quizVerifyRes = await fetch(`${baseUrl}/quizzes/${quizId}`, { headers: { 'Authorization': `Bearer ${studentToken}` } });
    const quizVerifyData = await quizVerifyRes.json();
    if (quizVerifyData.data.attemptsRemaining !== 0) throw new Error('attemptsRemaining not 0');
    console.log('✔ Quiz endpoint correctly reports 0 attempts remaining.');

    // 15. Student Analytics & Leaderboard
    console.log('\n13. Fetch Analytics & Leaderboard...');
    const perfRes = await fetch(`${baseUrl}/analytics/my-performance`, { headers: { 'Authorization': `Bearer ${studentToken}` } });
    const perfData = await perfRes.json();
    if (!perfData.success || perfData.data.highestScore !== 10) throw new Error('Analytics failed');
    
    const leadRes = await fetch(`${baseUrl}/leaderboard`, { headers: { 'Authorization': `Bearer ${studentToken}` } });
    const leadData = await leadRes.json();
    if (!leadData.success || !leadData.data.leaderboard || !leadData.data.myRank) throw new Error('Leaderboard failed or missing myRank');
    console.log('✔ Leaderboard fetched. myRank:', leadData.data.myRank);

    console.log('\n--- ALL STUDENT TESTS PASSED SUCCESSFULLY ---');
}

runStudentTests().catch(console.error);
