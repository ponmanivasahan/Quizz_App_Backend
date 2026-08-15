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
const isProduction = env === 'production';

// Fail-fast database validation for production
if (isProduction && !process.env.DATABASE_URL) {
  const requiredVars = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
  const missingVars = requiredVars.filter(v => !process.env[v]);
  
  if (missingVars.length > 0) {
    console.error(`Database configuration is incomplete. Check DB_HOST, DB_PORT, DB_NAME, DB_USER and DB_PASSWORD. Missing: ${missingVars.join(', ')}`);
    process.exit(1);
  }
  
  if (process.env.DB_HOST === 'localhost' || process.env.DB_HOST === '127.0.0.1') {
    console.error("Database configuration error: DO NOT USE LOCALHOST IN PRODUCTION. Provide a remote MySQL host.");
    process.exit(1);
  }
}

if (process.env.DATABASE_URL) {
  let dbUrl = process.env.DATABASE_URL;
  // Strip any query parameters (like ?ssl-mode=REQUIRED) so they don't override our dialectOptions
  if (dbUrl.includes('?')) {
      dbUrl = dbUrl.split('?')[0]; 
  }
  
  console.log('Database host: configured (using DATABASE_URL with explicit SSL)');
  sequelize = new Sequelize(dbUrl, {
    dialect: 'mysql',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  });
} else if (config.use_env_variable) {
  console.log('Database host: configured (using use_env_variable)');
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  const dbName = process.env.DB_NAME !== undefined ? String(process.env.DB_NAME) : config.database;
  const dbUser = process.env.DB_USER !== undefined ? String(process.env.DB_USER) : config.username;
  const dbPass = process.env.DB_PASSWORD !== undefined ? String(process.env.DB_PASSWORD) : config.password;
  const dbHost = process.env.DB_HOST !== undefined ? String(process.env.DB_HOST) : config.host;
  const dbPort = process.env.DB_PORT !== undefined ? parseInt(process.env.DB_PORT, 10) : (config.port || 3306);
  
  console.log(`Database host: ${dbHost}`);
  console.log(`Database name: ${dbName}`);

  const sequelizeConfig = Object.assign({}, config, {
    host: dbHost,
    port: dbPort,
    username: dbUser,
    password: dbPass,
    database: dbName,
    logging: false
  });

  if (dbHost && (dbHost.includes('aivencloud') || dbHost.includes('render') || process.env.DB_SSL === 'true' || isProduction)) {
    sequelizeConfig.dialectOptions = {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    };
  }

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
