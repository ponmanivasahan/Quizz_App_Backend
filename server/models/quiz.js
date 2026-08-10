'use strict';
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
};