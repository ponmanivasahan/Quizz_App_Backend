'use strict';
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
};