'use strict';
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
    attemptNumber: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    score: { type: DataTypes.INTEGER, defaultValue: 0 },
    totalMarks: { type: DataTypes.INTEGER, allowNull: false },
    percentage: { type: DataTypes.FLOAT, defaultValue: 0 },
    startedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    submittedAt: DataTypes.DATE,
    status: { type: DataTypes.STRING, defaultValue: 'In Progress' }
  }, {
    sequelize,
    modelName: 'Attempt',
    indexes: [
      {
        unique: true,
        fields: ['userId', 'quizId', 'attemptNumber']
      }
    ]
  });
  return Attempt;
};