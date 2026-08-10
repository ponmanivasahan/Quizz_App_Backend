'use strict';
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
};