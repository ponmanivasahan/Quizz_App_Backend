require('dotenv').config({ path: __dirname + '/../.env' });
const { User, Quiz, Question, sequelize } = require('../models');

const quizTopics = [
  "HTML Fundamentals", "CSS Fundamentals", "JavaScript Basics", "JavaScript Advanced", "React Fundamentals",
  "React Hooks", "Node.js Fundamentals", "Express.js", "REST API", "MongoDB Basics",
  "SQL Fundamentals", "PostgreSQL Advanced", "Git & GitHub", "Docker Basics", "Data Structures",
  "Algorithms", "Python Basics", "Python Advanced", "Java Fundamentals", "C++ Basics",
  "TypeScript Basics", "Software Engineering", "Computer Networks", "Operating Systems", "Cyber Security"
];

const topicConcepts = {
  "HTML Fundamentals": ["HTML elements", "Semantic HTML", "Forms", "Tables", "Links", "Images", "Attributes", "Accessibility", "HTML5", "Media elements"],
  "CSS Fundamentals": ["Selectors", "Box model", "Flexbox", "Grid", "Positioning", "Specificity", "Responsive design", "Media queries", "Pseudo classes", "Animations"],
  "JavaScript Basics": ["Variables", "Data types", "Functions", "Arrays", "Objects", "Scope", "Closures", "Promises", "Async/await", "DOM", "Events"],
  "React Fundamentals": ["Components", "JSX", "Props", "State", "Hooks", "useEffect", "useState", "Context", "Routing", "Component lifecycle"]
};

const generateQuestions = (quizTitle, index) => {
    const questions = [];
    const concepts = topicConcepts[quizTitle] || ["Syntax", "Architecture", "Best Practices", "Performance", "Security", "Deployment", "Debugging", "Testing", "Integration", "APIs"];
    
    for (let i = 1; i <= 25; i++) {
        const diff = i <= 10 ? 'Easy' : i <= 20 ? 'Medium' : 'Hard';
        const concept = concepts[i % concepts.length];
        
        let questionText = `Which of the following best describes the role of ${concept} in ${quizTitle}?`;
        if (i % 3 === 0) questionText = `How do you properly implement ${concept} when working with ${quizTitle}?`;
        if (i % 3 === 1) questionText = `What is a common pitfall when using ${concept} in ${quizTitle}?`;
        
        const options = [
            `It defines the core structure of the ${concept}.`,
            `It is used for styling and layout of the ${concept}.`,
            `It handles asynchronous logic for the ${concept}.`,
            `It is a security mechanism for the ${concept}.`
        ];
        
        // Randomize correct option index deterministically based on i
        const correctOptIndex = i % 4;
        
        questions.push({
            questionText,
            optionA: options[0],
            optionB: options[1],
            optionC: options[2],
            optionD: options[3],
            correctAnswer: ["A", "B", "C", "D"][correctOptIndex],
            marks: diff === 'Easy' ? 1 : diff === 'Medium' ? 2 : 3,
            difficulty: diff
        });
    }
    return questions;
};

async function seed() {
    try {
        await sequelize.sync({ alter: true });
        
        let admin = await User.findOne({ where: { email: 'admin123@gmail.com' } });
        if (!admin) {
            console.log('Creating admin...');
            const bcrypt = require('bcryptjs');
            admin = await User.create({
                name: 'Seed Admin',
                email: 'admin123@gmail.com',
                password: await bcrypt.hash('12345', 10),
                role: 'admin'
            });
        }

        console.log('Clearing old data for fresh massive seed...');
        const { Attempt, AttemptAnswer } = require('../models');
        await AttemptAnswer.destroy({ where: {} });
        await Attempt.destroy({ where: {} });
        await Question.destroy({ where: {} });
        await Quiz.destroy({ where: {} });

        let totalQuestions = 0;
        
        for (let i = 0; i < quizTopics.length; i++) {
            const topic = quizTopics[i];
            console.log(`Creating quiz: ${topic}...`);
            const quiz = await Quiz.create({
                title: topic,
                description: `A comprehensive test on ${topic}.`,
                duration: 30,
                totalMarks: 50, // Arbitrary base, attempts calculate dynamic marks
                questionsPerAttempt: 10,
                createdBy: admin.id
            });
            
            const questions = generateQuestions(topic, i);
            const questionData = questions.map(q => ({ ...q, quizId: quiz.id }));
            
            await Question.bulkCreate(questionData);
            totalQuestions += questionData.length;
        }

        console.log(`\n✅ MASSIVE SEED COMPLETED`);
        console.log(`- Created ${quizTopics.length} quizzes.`);
        console.log(`- Created ${totalQuestions} questions.`);
        
        process.exit(0);
    } catch (error) {
        console.error('Seed failed:', error);
        process.exit(1);
    }
}

seed();
