require('dotenv').config({ path: __dirname + '/../.env' });
const { Sequelize } = require('sequelize');
const { Quiz, Question, User, sequelize } = require('../models');
const bcrypt = require('bcryptjs');

const quizzesData = [
  { topic: 'HTML Fundamentals', desc: 'Test your knowledge on HTML tags, structure, and semantics.' },
  { topic: 'CSS Fundamentals', desc: 'Assess your understanding of CSS styling, selectors, and layout.' },
  { topic: 'JavaScript Basics', desc: 'Core JavaScript concepts including variables, loops, and basic functions.' },
  { topic: 'JavaScript Advanced', desc: 'Deep dive into closures, prototypes, async/await, and event loops.' },
  { topic: 'React Fundamentals', desc: 'JSX, components, state, and props in React.' },
  { topic: 'React Hooks', desc: 'Understanding useState, useEffect, useContext, and custom hooks.' },
  { topic: 'Node.js Fundamentals', desc: 'Event loop, modules, file system, and core Node.js concepts.' },
  { topic: 'Express.js', desc: 'Routing, middleware, and request handling in Express.' },
  { topic: 'REST API', desc: 'Principles of RESTful design, HTTP methods, and status codes.' },
  { topic: 'MySQL Basics', desc: 'Tables, data types, primary keys, and foreign keys.' },
  { topic: 'SQL Queries', desc: 'SELECT, JOINs, GROUP BY, and subqueries.' },
  { topic: 'DBMS Fundamentals', desc: 'ACID properties, normalization, and indexing.' },
  { topic: 'Data Structures', desc: 'Arrays, Linked Lists, Stacks, Queues, and Trees.' },
  { topic: 'Algorithms', desc: 'Sorting, searching, and Big O notation.' },
  { topic: 'C Programming', desc: 'Pointers, memory management, and syntax in C.' },
  { topic: 'C++ Programming', desc: 'Classes, templates, STL, and object-oriented features.' },
  { topic: 'Python Fundamentals', desc: 'Lists, dictionaries, comprehensions, and Python syntax.' },
  { topic: 'Object Oriented Programming', desc: 'Inheritance, polymorphism, encapsulation, and abstraction.' },
  { topic: 'Computer Networks', desc: 'OSI model, TCP/IP, DNS, and routing protocols.' },
  { topic: 'Operating Systems', desc: 'Processes, threads, memory management, and file systems.' },
  { topic: 'Git and GitHub', desc: 'Version control basics, branching, merging, and pull requests.' },
  { topic: 'Web Development', desc: 'General concepts covering the full lifecycle of web applications.' },
  { topic: 'Full Stack Development', desc: 'Integration between frontend and backend systems.' },
  { topic: 'Software Engineering', desc: 'SDLC, Agile methodologies, and testing.' },
  { topic: 'General Programming Aptitude', desc: 'Logical reasoning and generic programming problem solving.' }
];

const questionBank = {
  'HTML Fundamentals': [
    { q: 'Which HTML element is used to create a hyperlink?', options: ['<link>', '<a>', '<href>', '<url>'], ans: 'B', m: 1 },
    { q: 'What does HTML stand for?', options: ['Hyper Text Preprocessor', 'Hyper Text Markup Language', 'Hyper Tool Multi Language', 'Hyperlink and Text Markup Language'], ans: 'B', m: 1 },
    { q: 'Which tag is used to create a numbered list?', options: ['<ul>', '<nl>', '<li>', '<ol>'], ans: 'D', m: 1 },
    { q: 'How do you insert a comment in HTML?', options: ['// This is a comment', '/* This is a comment */', '<!-- This is a comment -->', '<comment> This is a comment </comment>'], ans: 'C', m: 1 }
  ],
  'CSS Fundamentals': [
    { q: 'What does CSS stand for?', options: ['Cascading Style Sheets', 'Colorful Style Sheets', 'Computer Style Sheets', 'Creative Style Sheets'], ans: 'A', m: 1 },
    { q: 'Which HTML attribute is used to define inline styles?', options: ['styles', 'font', 'class', 'style'], ans: 'D', m: 1 },
    { q: 'Which is the correct CSS syntax?', options: ['body {color: black;}', '{body;color:black;}', 'body:color=black;', '{body:color=black;}'], ans: 'A', m: 1 },
    { q: 'How do you select an element with id "demo"?', options: ['#demo', '.demo', 'demo', '*demo'], ans: 'A', m: 1 }
  ],
  'JavaScript Basics': [
    { q: 'Inside which HTML element do we put the JavaScript?', options: ['<javascript>', '<scripting>', '<js>', '<script>'], ans: 'D', m: 1 },
    { q: 'How do you write "Hello World" in an alert box?', options: ['alertBox("Hello World");', 'msgBox("Hello World");', 'alert("Hello World");', 'msg("Hello World");'], ans: 'C', m: 1 },
    { q: 'How do you create a function in JavaScript?', options: ['function myFunction()', 'function = myFunction()', 'function:myFunction()', 'myFunction()'], ans: 'A', m: 1 },
    { q: 'Which operator is used to assign a value to a variable?', options: ['*', '-', '=', 'x'], ans: 'C', m: 1 }
  ],
  'JavaScript Advanced': [
    { q: 'What is a closure in JavaScript?', options: ['A way to block variables', 'A function retaining access to its lexical scope', 'A syntax error', 'A type of loop'], ans: 'B', m: 2 },
    { q: 'What does the "await" keyword do?', options: ['Pauses execution until a Promise settles', 'Stops the script entirely', 'Makes a variable constant', 'Triggers an event'], ans: 'A', m: 2 },
    { q: 'Which of the following is NOT a JS primitive?', options: ['String', 'Number', 'Object', 'Boolean'], ans: 'C', m: 1 },
    { q: 'What does the event loop do?', options: ['Compiles JS code', 'Manages asynchronous callbacks', 'Styles the webpage', 'Connects to databases'], ans: 'B', m: 2 }
  ],
  'React Fundamentals': [
    { q: 'What is React?', options: ['A CSS framework', 'A JavaScript library for building user interfaces', 'A database', 'An operating system'], ans: 'B', m: 1 },
    { q: 'What is JSX?', options: ['JavaScript XML', 'Java Syntax Extension', 'JSON X', 'JavaScript X'], ans: 'A', m: 1 },
    { q: 'How do you pass data to a React component?', options: ['Using state', 'Using attributes', 'Using props', 'Using classes'], ans: 'C', m: 1 },
    { q: 'What method is required in a React class component?', options: ['display()', 'render()', 'return()', 'mount()'], ans: 'B', m: 1 }
  ],
  'React Hooks': [
    { q: 'Which hook is used to manage state in a functional component?', options: ['useEffect', 'useState', 'useReducer', 'useContext'], ans: 'B', m: 1 },
    { q: 'What does useEffect do?', options: ['Performs side effects', 'Renders the component', 'Creates state', 'Handles styling'], ans: 'A', m: 1 },
    { q: 'Can you use hooks inside a class component?', options: ['Yes', 'No', 'Only useState', 'Only custom hooks'], ans: 'B', m: 1 },
    { q: 'Which hook would you use to avoid prop drilling?', options: ['useMemo', 'useState', 'useContext', 'useRef'], ans: 'C', m: 2 }
  ],
  'Node.js Fundamentals': [
    { q: 'What is Node.js?', options: ['A frontend framework', 'A JavaScript runtime environment', 'A web browser', 'A database engine'], ans: 'B', m: 1 },
    { q: 'Which engine compiles Node.js?', options: ['SpiderMonkey', 'Chakra', 'V8', 'Blink'], ans: 'C', m: 1 },
    { q: 'How do you import a module in commonJS?', options: ['import module', 'require("module")', 'include "module"', 'load("module")'], ans: 'B', m: 1 },
    { q: 'Node.js is naturally:', options: ['Multi-threaded', 'Synchronous', 'Single-threaded and asynchronous', 'Strictly procedural'], ans: 'C', m: 2 }
  ],
  'Express.js': [
    { q: 'What is Express.js?', options: ['A database ORM', 'A web application framework for Node.js', 'A CSS preprocessor', 'A testing library'], ans: 'B', m: 1 },
    { q: 'How do you define a route in Express?', options: ['app.get("/route", callback)', 'server.route("/route")', 'route.create("/route")', 'Express.add("/route")'], ans: 'A', m: 1 },
    { q: 'What is middleware in Express?', options: ['Functions that execute during request-response cycle', 'A type of database', 'The final response sender', 'A server configuration file'], ans: 'A', m: 2 },
    { q: 'Which method starts the Express server?', options: ['app.start()', 'app.run()', 'app.listen()', 'app.serve()'], ans: 'C', m: 1 }
  ],
  'REST API': [
    { q: 'What does REST stand for?', options: ['Representational State Transfer', 'Responsive Server Technology', 'Realtime System Transfer', 'Relational State Transfer'], ans: 'A', m: 1 },
    { q: 'Which HTTP method is idempotent?', options: ['POST', 'PUT', 'PATCH', 'CONNECT'], ans: 'B', m: 2 },
    { q: 'What is the standard status code for "Not Found"?', options: ['200', '404', '500', '403'], ans: 'B', m: 1 },
    { q: 'Which format is most commonly used for REST API responses?', options: ['XML', 'HTML', 'JSON', 'YAML'], ans: 'C', m: 1 }
  ],
  'MySQL Basics': [
    { q: 'What type of database is MySQL?', options: ['NoSQL', 'Relational Database', 'Graph Database', 'Document Store'], ans: 'B', m: 1 },
    { q: 'Which command creates a database?', options: ['MAKE DATABASE', 'CREATE DATABASE', 'NEW DATABASE', 'BUILD DATABASE'], ans: 'B', m: 1 },
    { q: 'What defines a row uniquely in a table?', options: ['Foreign Key', 'Index', 'Primary Key', 'Unique Column'], ans: 'C', m: 1 },
    { q: 'Which command removes a table entirely?', options: ['DELETE TABLE', 'TRUNCATE TABLE', 'REMOVE TABLE', 'DROP TABLE'], ans: 'D', m: 1 }
  ],
  'SQL Queries': [
    { q: 'Which statement is used to extract data from a database?', options: ['OPEN', 'GET', 'EXTRACT', 'SELECT'], ans: 'D', m: 1 },
    { q: 'How do you filter records?', options: ['FILTER', 'WHERE', 'HAVING', 'MATCH'], ans: 'B', m: 1 },
    { q: 'Which keyword sorts the result set?', options: ['ORDER BY', 'SORT BY', 'ALIGN BY', 'ARRANGE BY'], ans: 'A', m: 1 },
    { q: 'Which join returns all rows from the left table?', options: ['INNER JOIN', 'RIGHT JOIN', 'LEFT JOIN', 'FULL JOIN'], ans: 'C', m: 2 }
  ],
  'DBMS Fundamentals': [
    { q: 'What does ACID stand for?', options: ['Atomicity, Consistency, Isolation, Durability', 'Accuracy, Completeness, Integrity, Durability', 'Atomicity, Concurrency, Isolation, Data', 'Action, Consistency, Integrity, Dependency'], ans: 'A', m: 2 },
    { q: 'What is database normalization?', options: ['Adding redundancy', 'Organizing data to reduce redundancy', 'Encrypting data', 'Backing up data'], ans: 'B', m: 1 },
    { q: 'Which key links two tables together?', options: ['Primary Key', 'Super Key', 'Foreign Key', 'Candidate Key'], ans: 'C', m: 1 },
    { q: 'What is a transaction?', options: ['A single unit of work', 'A database connection', 'A table column', 'A query result'], ans: 'A', m: 2 }
  ],
  'Data Structures': [
    { q: 'Which data structure uses LIFO?', options: ['Queue', 'Stack', 'Tree', 'Graph'], ans: 'B', m: 1 },
    { q: 'Which of these is a non-linear data structure?', options: ['Array', 'Linked List', 'Tree', 'Stack'], ans: 'C', m: 1 },
    { q: 'What is the time complexity of binary search?', options: ['O(1)', 'O(n)', 'O(n log n)', 'O(log n)'], ans: 'D', m: 2 },
    { q: 'What structure prevents duplicate elements natively?', options: ['Array', 'Set', 'List', 'Queue'], ans: 'B', m: 1 }
  ],
  'Algorithms': [
    { q: 'Which sorting algorithm uses divide and conquer?', options: ['Bubble Sort', 'Insertion Sort', 'Merge Sort', 'Selection Sort'], ans: 'C', m: 2 },
    { q: 'What is the worst-case time complexity of Quick Sort?', options: ['O(n)', 'O(n log n)', 'O(n^2)', 'O(1)'], ans: 'C', m: 2 },
    { q: 'Which algorithm finds the shortest path in a graph?', options: ['Dijkstras', 'DFS', 'Binary Search', 'Kruskals'], ans: 'A', m: 2 },
    { q: 'What is Big O notation?', options: ['Space measurement only', 'Upper bound of complexity', 'Lower bound of complexity', 'Exact running time'], ans: 'B', m: 1 }
  ],
  'C Programming': [
    { q: 'Who developed C?', options: ['James Gosling', 'Bjarne Stroustrup', 'Dennis Ritchie', 'Guido van Rossum'], ans: 'C', m: 1 },
    { q: 'What symbol is used for a pointer?', options: ['&', '*', '#', '@'], ans: 'B', m: 1 },
    { q: 'Which function allocates memory dynamically?', options: ['alloc()', 'malloc()', 'create()', 'new()'], ans: 'B', m: 2 },
    { q: 'What is the extension of a C source file?', options: ['.cpp', '.cs', '.c', '.h'], ans: 'C', m: 1 }
  ],
  'C++ Programming': [
    { q: 'Which of these is NOT a feature of OOP in C++?', options: ['Encapsulation', 'Polymorphism', 'Inheritance', 'Compilation'], ans: 'D', m: 1 },
    { q: 'What does STL stand for?', options: ['Standard Template Library', 'Simple Type Language', 'Standard Type Library', 'System Template Library'], ans: 'A', m: 2 },
    { q: 'How do you create an object in C++?', options: ['ClassName obj;', 'new ClassName;', 'obj = ClassName()', 'create ClassName'], ans: 'A', m: 1 },
    { q: 'Which keyword allows access to private members by non-member functions?', options: ['public', 'protected', 'friend', 'static'], ans: 'C', m: 2 }
  ],
  'Python Fundamentals': [
    { q: 'How do you define a function in Python?', options: ['function myFunc():', 'def myFunc():', 'create myFunc():', 'func myFunc():'], ans: 'B', m: 1 },
    { q: 'Which data type is immutable?', options: ['List', 'Dictionary', 'Set', 'Tuple'], ans: 'D', m: 2 },
    { q: 'What keyword is used for exception handling?', options: ['catch', 'except', 'handle', 'error'], ans: 'B', m: 1 },
    { q: 'How do you add an item to a list?', options: ['list.add()', 'list.push()', 'list.append()', 'list.insert()'], ans: 'C', m: 1 }
  ],
  'Object Oriented Programming': [
    { q: 'What describes hiding internal details?', options: ['Polymorphism', 'Encapsulation', 'Inheritance', 'Abstraction'], ans: 'B', m: 1 },
    { q: 'What is polymorphism?', options: ['Multiple forms of a method', 'Hiding data', 'Reusing code', 'Creating objects'], ans: 'A', m: 2 },
    { q: 'Which concept allows a class to derive from another?', options: ['Inheritance', 'Abstraction', 'Encapsulation', 'Overloading'], ans: 'A', m: 1 },
    { q: 'What is a constructor?', options: ['A destructor method', 'A method to build UI', 'A special method to initialize objects', 'A variable'], ans: 'C', m: 1 }
  ],
  'Computer Networks': [
    { q: 'How many layers are in the OSI model?', options: ['4', '5', '7', '9'], ans: 'C', m: 1 },
    { q: 'What protocol translates domain names to IP addresses?', options: ['DHCP', 'HTTP', 'FTP', 'DNS'], ans: 'D', m: 1 },
    { q: 'Which layer handles routing?', options: ['Physical', 'Data Link', 'Network', 'Transport'], ans: 'C', m: 2 },
    { q: 'What does TCP stand for?', options: ['Transmission Control Protocol', 'Transfer Control Protocol', 'Transport Communication Protocol', 'Terminal Control Protocol'], ans: 'A', m: 1 }
  ],
  'Operating Systems': [
    { q: 'What manages hardware and software resources?', options: ['Compiler', 'Operating System', 'CPU', 'Application'], ans: 'B', m: 1 },
    { q: 'What is a thread?', options: ['A hardware component', 'A lightweight process', 'A network connection', 'A memory block'], ans: 'B', m: 2 },
    { q: 'Which scheduling algorithm prevents starvation best?', options: ['FCFS', 'SJF', 'Round Robin', 'Priority'], ans: 'C', m: 2 },
    { q: 'What causes thrashing?', options: ['Too much RAM', 'Excessive paging', 'Network failure', 'CPU overheating'], ans: 'B', m: 2 }
  ],
  'Git and GitHub': [
    { q: 'What command initializes a new Git repository?', options: ['git start', 'git init', 'git create', 'git new'], ans: 'B', m: 1 },
    { q: 'How do you stage changes?', options: ['git commit', 'git push', 'git add', 'git stage'], ans: 'C', m: 1 },
    { q: 'What does "git clone" do?', options: ['Deletes a repo', 'Copies a remote repository locally', 'Merges branches', 'Creates a new branch'], ans: 'B', m: 1 },
    { q: 'What is a Pull Request?', options: ['A bug report', 'A request to merge code into another branch', 'A direct commit to main', 'A local fetch operation'], ans: 'B', m: 1 }
  ],
  'Web Development': [
    { q: 'Which standard dictates accessibility on the web?', options: ['W3C', 'WCAG', 'IEEE', 'IETF'], ans: 'B', m: 2 },
    { q: 'What does CORS stand for?', options: ['Cross-Origin Resource Sharing', 'Computer Oriented Response System', 'Cross-Object Relational System', 'Centralized Origin Resource System'], ans: 'A', m: 2 },
    { q: 'Which storage allows data to persist even after browser closure?', options: ['Session Storage', 'Cookies', 'Local Storage', 'Cache'], ans: 'C', m: 1 },
    { q: 'What is a CDN?', options: ['Central Data Network', 'Content Delivery Network', 'Computer Delivery Node', 'Content Distribution Node'], ans: 'B', m: 1 }
  ],
  'Full Stack Development': [
    { q: 'What does MERN stand for?', options: ['MongoDB, Express, React, Node.js', 'MySQL, Express, Ruby, Node.js', 'MongoDB, Ember, React, Node.js', 'MySQL, Ember, React, Node.js'], ans: 'A', m: 1 },
    { q: 'Which layer connects frontend and database?', options: ['UI', 'Backend Server', 'Browser', 'OS'], ans: 'B', m: 1 },
    { q: 'What is an ORM?', options: ['Object Relational Mapper', 'Object Resource Manager', 'Oriented Response Model', 'Output Routing Module'], ans: 'A', m: 1 },
    { q: 'Why use WebSockets instead of HTTP?', options: ['For static files', 'For real-time bidirectional communication', 'For secure passwords', 'For database queries'], ans: 'B', m: 2 }
  ],
  'Software Engineering': [
    { q: 'What does SDLC stand for?', options: ['Software Design Lifecycle', 'System Development Lifecycle', 'Software Development Lifecycle', 'System Design Lifecycle'], ans: 'C', m: 1 },
    { q: 'Which methodology uses sprints?', options: ['Waterfall', 'Agile', 'V-Model', 'Spiral'], ans: 'B', m: 1 },
    { q: 'What is Unit Testing?', options: ['Testing the entire system', 'Testing individual components', 'Testing user interfaces', 'Testing network load'], ans: 'B', m: 1 },
    { q: 'What is a bug?', options: ['A feature', 'A software defect or error', 'A type of code', 'A network packet'], ans: 'B', m: 1 }
  ],
  'General Programming Aptitude': [
    { q: 'What is the output of true AND false?', options: ['true', 'false', 'null', 'undefined'], ans: 'B', m: 1 },
    { q: 'What is an infinite loop?', options: ['A loop that never executes', 'A loop that terminates normally', 'A loop that never ends', 'A syntax error'], ans: 'C', m: 1 },
    { q: 'Which concept uses a "base case"?', options: ['Iteration', 'Recursion', 'Encapsulation', 'Inheritance'], ans: 'B', m: 2 },
    { q: 'What does dry stand for in coding?', options: ['Don\'t Repeat Yourself', 'Do Run Yourself', 'Direct Recursive Yield', 'Data Retrieval Yield'], ans: 'A', m: 1 }
  ]
};

async function runSeed() {
  try {
    // 1. Check if seed data exists
    const existingQuizzesCount = await Quiz.count();
    if (existingQuizzesCount >= 25) {
      console.log('Database already appears to be seeded with quizzes. Run successful, no duplicates created.');
      process.exit(0);
    }

    console.log('Seeding process started...');

    // 2. Ensure an Admin user exists for createdBy
    let admin = await User.findOne({ where: { role: 'admin' } });
    if (!admin) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      admin = await User.create({
        name: 'Seed Admin',
        email: 'seedadmin@test.com',
        password: hashedPassword,
        role: 'admin'
      });
      console.log('Created a default seed admin.');
    }

    // 3. Create Quizzes and Questions
    let totalQuestionsSeeded = 0;
    
    for (const data of quizzesData) {
      // Create quiz
      const quiz = await Quiz.create({
        title: data.topic,
        description: data.desc,
        duration: 20, // 20 minutes default
        totalMarks: 4, // 4 questions * roughly 1 mark each
        status: 'active',
        createdBy: admin.id
      });
      
      const qList = questionBank[data.topic] || [];
      const questionsToCreate = qList.map(q => ({
        quizId: quiz.id,
        questionText: q.q,
        optionA: q.options[0],
        optionB: q.options[1],
        optionC: q.options[2],
        optionD: q.options[3],
        correctAnswer: q.ans,
        marks: q.m
      }));

      await Question.bulkCreate(questionsToCreate);
      totalQuestionsSeeded += questionsToCreate.length;
    }

    console.log(`Successfully seeded 25 Quizzes and ${totalQuestionsSeeded} Questions.`);
    process.exit(0);
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
}

runSeed();
