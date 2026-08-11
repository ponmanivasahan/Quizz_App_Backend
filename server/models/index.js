'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const db = {};

let sequelize;

// If a full connection string is provided, use it directly (Aiven provides this as 'Service URI')
if (process.env.DATABASE_URL) {
  console.log('Using DATABASE_URL for connection');
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'mysql',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  });
} else if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  // Prefer explicit environment variables when available (from .env)
  const dbName = process.env.DB_NAME !== undefined ? String(process.env.DB_NAME) : config.database;
  const dbUser = process.env.DB_USER !== undefined ? String(process.env.DB_USER) : config.username;
  const dbPass = process.env.DB_PASSWORD !== undefined ? String(process.env.DB_PASSWORD) : config.password;
  const dbHost = process.env.DB_HOST !== undefined ? String(process.env.DB_HOST) : config.host;
  const dbPort = process.env.DB_PORT !== undefined ? parseInt(process.env.DB_PORT, 10) : (config.port || 3306);
  // Debug: show types and values used for DB connection
  console.log('DB_CONN', {
    dbName,
    dbUser,
    dbPass,
    dbHost,
    dbPort,
    types: {
      dbName: typeof dbName,
      dbUser: typeof dbUser,
      dbPass: typeof dbPass,
      dbHost: typeof dbHost,
    }
  });

  const sequelizeConfig = Object.assign({}, config, {
    host: dbHost,
    port: dbPort,
    username: dbUser,
    password: dbPass,
    database: dbName,
  });

  // Aiven and many cloud providers require SSL. 
  // Automatically enable SSL if we are connecting to a cloud provider
  if (dbHost && (dbHost.includes('aivencloud') || dbHost.includes('render') || process.env.DB_SSL === 'true' || env === 'production')) {
    sequelizeConfig.dialectOptions = {
      ssl: {
        require: true,
        rejectUnauthorized: false // Required for some cloud DBs without custom certs
      }
    };
  }

  // Ensure Sequelize receives string credentials (defensive casting)
  sequelize = new Sequelize(String(dbName), String(dbUser), String(dbPass), sequelizeConfig);
}

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
