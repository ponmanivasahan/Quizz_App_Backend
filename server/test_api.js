const fs = require('fs');

async function testApi() {
    console.log('--- STARTING API TESTS ---');
    const baseUrl = 'http://localhost:3000/api';
    
    // 1. Login Admin
    console.log('\n1. Login Admin...');
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin123@gmail.com', password: '12345' })
    });
    const loginData = await loginRes.json();
    if (!loginData.success) throw new Error('Login failed: ' + JSON.stringify(loginData));
    const token = loginData.data.token;
    console.log('✔ Login successful, token acquired.');

    // 2. Get Users
    console.log('\n2. Get Users...');
    const usersRes = await fetch(`${baseUrl}/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const usersData = await usersRes.json();
    if (!usersData.success || usersData.data.length === 0 || usersData.data[0].password) {
        throw new Error('Get users failed or returned passwords.');
    }
    console.log('✔ Get Users successful. Validated no passwords returned.');

    // 3. Create Quiz
    console.log('\n3. Create Quiz...');
    const createQuizRes = await fetch(`${baseUrl}/quizzes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
            title: 'Automated Test Quiz',
            description: 'Created by test script',
            duration: 15,
            totalMarks: 20
        })
    });
    const createQuizData = await createQuizRes.json();
    if (!createQuizData.success) throw new Error('Create quiz failed: ' + JSON.stringify(createQuizData));
    const quizId = createQuizData.data.id;
    console.log(`✔ Quiz created successfully with ID: ${quizId}`);

    // 4. Get Quizzes
    console.log('\n4. Get Quizzes...');
    const quizzesRes = await fetch(`${baseUrl}/quizzes`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const quizzesData = await quizzesRes.json();
    const foundQuiz = quizzesData.data.find(q => q.id === quizId);
    if (!foundQuiz) throw new Error('Created quiz not found in Get Quizzes');
    console.log('✔ Get Quizzes successful. Created quiz found in list.');

    // 5. Get Quiz by ID
    console.log('\n5. Get Quiz by ID...');
    const quizRes = await fetch(`${baseUrl}/quizzes/${quizId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const quizData = await quizRes.json();
    if (!quizData.success || quizData.data.id !== quizId) throw new Error('Get quiz by ID failed');
    console.log('✔ Get Quiz by ID successful.');

    // 6. Create Question
    console.log('\n6. Create Question...');
    const createQuestionRes = await fetch(`${baseUrl}/quizzes/${quizId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
            questionText: 'What is 2 + 2?',
            optionA: '3',
            optionB: '4',
            optionC: '5',
            optionD: '6',
            correctAnswer: 'B',
            marks: 5
        })
    });
    const createQuestionData = await createQuestionRes.json();
    if (!createQuestionData.success) throw new Error('Create question failed: ' + JSON.stringify(createQuestionData));
    const questionId = createQuestionData.data.id;
    console.log(`✔ Create Question successful. Question ID: ${questionId}, Quiz ID: ${createQuestionData.data.quizId}`);

    // 7. Get Questions
    console.log('\n7. Get Questions...');
    const getQuestionsRes = await fetch(`${baseUrl}/quizzes/${quizId}/questions`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const getQuestionsData = await getQuestionsRes.json();
    if (!getQuestionsData.success || getQuestionsData.data.length !== 1 || getQuestionsData.data[0].id !== questionId) {
        throw new Error('Get questions failed');
    }
    console.log('✔ Get Questions successful. Verified only one question belongs to the quiz.');

    // 8. Edit Question
    console.log('\n8. Edit Question...');
    const editQuestionRes = await fetch(`${baseUrl}/questions/${questionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
            questionText: 'What is 3 + 3?'
        })
    });
    const editQuestionData = await editQuestionRes.json();
    if (!editQuestionData.success || editQuestionData.data.questionText !== 'What is 3 + 3?') {
        throw new Error('Edit question failed');
    }
    console.log('✔ Edit Question successful. Record updated properly.');

    // 9. Delete Question
    console.log('\n9. Delete Question...');
    const deleteQuestionRes = await fetch(`${baseUrl}/questions/${questionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const deleteQuestionData = await deleteQuestionRes.json();
    if (!deleteQuestionData.success) throw new Error('Delete question failed');
    console.log('✔ Delete Question successful. Record removed.');

    console.log('\n--- ALL TESTS PASSED SUCCESSFULLY ---');
}

testApi().catch(console.error);
