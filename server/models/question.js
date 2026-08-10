'use strict';
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
};