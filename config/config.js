require('dotenv').config();
require('dotenv').load();

module.exports = {
  development: {
    username: process.env.RELACIONAL_DB_USERNAME,
    password: process.env.RELACIONAL_DB_PASS,
    database: process.env.RELACIONAL_DB_NAME,
    host: process.env.DEV_RELACIONAL_DB_HOST,
    projectId: process.env.FIREBASE_PROJECT_ID,
    jwtSecret: process.env.JWT_SECRET,
    dialect: 'mysql',
    pool: {
      max: 5,
      min: 0,
      acquire: 40000,
      idle: 20000,
    },
    // dialectModule: require('mysql2'),
  },
  production: {
    username: process.env.RELACIONAL_DB_USERNAME,
    password: process.env.RELACIONAL_DB_PASS,
    database: process.env.RELACIONAL_DB_NAME,
    host: process.env.PROD_RELACIONAL_DB_HOST,
    projectId: process.env.FIREBASE_PROJECT_ID,
    jwtSecret: process.env.JWT_SECRET,
    dialect: 'mysql',
    pool: {
      max: 5,
      min: 0,
      acquire: 40000,
      idle: 20000,
    },
    // dialectModule: require('mysql2'),
  },
};
