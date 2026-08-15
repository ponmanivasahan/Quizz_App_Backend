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

  let dbName = config.database;
  let dbUser = config.username;
  let dbPass = config.password;
  let dbHost = config.host;
  let dbPort = config.port || 3306;

  if (process.env.DATABASE_URL) {
    // Manually parse DATABASE_URL to avoid Sequelize parsing quirks and SSL drops
    const dbUrl = new URL(process.env.DATABASE_URL);
    dbHost = dbUrl.hostname;
    dbPort = dbUrl.port ? parseInt(dbUrl.port, 10) : 3306;
    dbUser = dbUrl.username;
    dbPass = dbUrl.password;
    dbName = dbUrl.pathname.replace('/', '');
    console.log('Database host: configured (Parsed from DATABASE_URL)');

    if (isProduction && (dbHost === 'localhost' || dbHost === '127.0.0.1')) {
      console.error("CRITICAL ERROR: Your DATABASE_URL contains 'localhost' or '127.0.0.1'. You CANNOT use your local database URL on Render. You MUST paste your AIVEN Service URI into DATABASE_URL.");
      process.exit(1);
    }
  } else {
    if (process.env.DB_NAME !== undefined) dbName = String(process.env.DB_NAME);
    if (process.env.DB_USER !== undefined) dbUser = String(process.env.DB_USER);
    if (process.env.DB_PASSWORD !== undefined) dbPass = String(process.env.DB_PASSWORD);
    if (process.env.DB_HOST !== undefined) dbHost = String(process.env.DB_HOST);
    if (process.env.DB_PORT !== undefined) dbPort = parseInt(process.env.DB_PORT, 10);
    console.log(`Database host: ${dbHost}`);
    console.log(`Database name: ${dbName}`);
  }

  const sequelizeConfig = Object.assign({}, config, {
    host: dbHost,
    port: dbPort,
    username: dbUser,
    password: dbPass,
    database: dbName,
    logging: false
  });

  // Aiven and other cloud providers require SSL.
  if (dbHost && (dbHost.includes('aivencloud') || dbHost.includes('render') || process.env.DB_SSL === 'true' || isProduction)) {
    sequelizeConfig.dialectOptions = {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    };
  }

  sequelize = new Sequelize(String(dbName), String(dbUser), String(dbPass), sequelizeConfig);

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
