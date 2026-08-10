const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, 'models');

const userModel = `'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.Attempt, { foreignKey: 'userId', as: 'attempts' });
      User.hasMany(models.Quiz, { foreignKey: 'createdBy', as: 'quizzes' });
    }
  }
  User.init({
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.STRING, defaultValue: 'student' }
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};`;

const quizModel = `'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Quiz extends Model {
    static associate(models) {
      Quiz.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
      Quiz.hasMany(models.Question, { foreignKey: 'quizId', as: 'questions', onDelete: 'CASCADE' });
      Quiz.hasMany(models.Attempt, { foreignKey: 'quizId', as: 'attempts', onDelete: 'CASCADE' });
    }
  }
  Quiz.init({
    title: { type: DataTypes.STRING, allowNull: false },
    description: DataTypes.TEXT,
    duration: { type: DataTypes.INTEGER, allowNull: false },
    totalMarks: { type: DataTypes.INTEGER, allowNull: false },
    status: { type: DataTypes.STRING, defaultValue: 'active' },
    createdBy: { type: DataTypes.INTEGER, allowNull: false }
  }, {
    sequelize,
    modelName: 'Quiz',
  });
  return Quiz;
};`;

const questionModel = `'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Question extends Model {
    static associate(models) {
      Question.belongsTo(models.Quiz, { foreignKey: 'quizId', as: 'quiz' });
      Question.hasMany(models.AttemptAnswer, { foreignKey: 'questionId', as: 'answers', onDelete: 'CASCADE' });
    }
  }
  Question.init({
    quizId: { type: DataTypes.INTEGER, allowNull: false },
    questionText: { type: DataTypes.TEXT, allowNull: false },
    optionA: { type: DataTypes.STRING, allowNull: false },
    optionB: { type: DataTypes.STRING, allowNull: false },
    optionC: { type: DataTypes.STRING, allowNull: false },
    optionD: { type: DataTypes.STRING, allowNull: false },
    correctAnswer: { type: DataTypes.STRING, allowNull: false },
    marks: { type: DataTypes.INTEGER, defaultValue: 1 }
  }, {
    sequelize,
    modelName: 'Question',
  });
  return Question;
};`;

const attemptModel = `'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Attempt extends Model {
    static associate(models) {
      Attempt.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      Attempt.belongsTo(models.Quiz, { foreignKey: 'quizId', as: 'quiz' });
      Attempt.hasMany(models.AttemptAnswer, { foreignKey: 'attemptId', as: 'answers', onDelete: 'CASCADE' });
    }
  }
  Attempt.init({
    userId: { type: DataTypes.INTEGER, allowNull: false },
    quizId: { type: DataTypes.INTEGER, allowNull: false },
    score: { type: DataTypes.INTEGER, defaultValue: 0 },
    totalMarks: { type: DataTypes.INTEGER, allowNull: false },
    percentage: { type: DataTypes.FLOAT, defaultValue: 0 },
    startedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    submittedAt: DataTypes.DATE,
    status: { type: DataTypes.STRING, defaultValue: 'In Progress' }
  }, {
    sequelize,
    modelName: 'Attempt',
  });
  return Attempt;
};`;

const attemptAnswerModel = `'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class AttemptAnswer extends Model {
    static associate(models) {
      AttemptAnswer.belongsTo(models.Attempt, { foreignKey: 'attemptId', as: 'attempt' });
      AttemptAnswer.belongsTo(models.Question, { foreignKey: 'questionId', as: 'question' });
    }
  }
  AttemptAnswer.init({
    attemptId: { type: DataTypes.INTEGER, allowNull: false },
    questionId: { type: DataTypes.INTEGER, allowNull: false },
    selectedAnswer: DataTypes.STRING,
    correctAnswer: DataTypes.STRING,
    marksObtained: { type: DataTypes.INTEGER, defaultValue: 0 },
    isCorrect: { type: DataTypes.BOOLEAN, defaultValue: false }
  }, {
    sequelize,
    modelName: 'AttemptAnswer',
  });
  return AttemptAnswer;
};`;

fs.writeFileSync(path.join(modelsDir, 'user.js'), userModel);
fs.writeFileSync(path.join(modelsDir, 'quiz.js'), quizModel);
fs.writeFileSync(path.join(modelsDir, 'question.js'), questionModel);
fs.writeFileSync(path.join(modelsDir, 'attempt.js'), attemptModel);
fs.writeFileSync(path.join(modelsDir, 'attemptanswer.js'), attemptAnswerModel);

console.log("Models updated successfully!");
