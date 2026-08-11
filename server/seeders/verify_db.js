require('dotenv').config({ path: __dirname + '/../.env' });
const { Sequelize } = require('sequelize');
const { Quiz, Question, sequelize } = require('../models');

async function verify() {
  try {
    const quizCount = await Quiz.count();
    console.log(`Expected 25 Quizzes. Actual: ${quizCount}`);
    
    const questionCount = await Question.count();
    console.log(`Expected 100 Questions. Actual: ${questionCount}`);
    
    const questionsPerQuiz = await Question.findAll({
      attributes: ['quizId', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['quizId'],
      raw: true
    });
    
    let allFours = true;
    questionsPerQuiz.forEach(q => {
      if (q.count !== 4) {
        allFours = false;
        console.log(`Mismatch on Quiz ID ${q.quizId}: found ${q.count} questions.`);
      }
    });
    
    if (allFours && questionsPerQuiz.length === 25) {
      console.log('Verified: Every quiz has exactly 4 questions.');
    } else if (allFours) {
      console.log(`Verified: Every quiz has exactly 4 questions, but there are ${questionsPerQuiz.length} quizzes with questions.`);
    }

    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
verify();
