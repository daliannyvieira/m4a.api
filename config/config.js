require('dotenv').config()
require('dotenv').load()

module.exports = {
  "localhost": {
    "username": process.env.LOCAL_RELACIONAL_DB_USERNAME,
    "password": process.env.LOCAL_RELACIONAL_DB_PASS,
    "database": process.env.LOCAL_RELACIONAL_DB_NAME,
    "host": process.env.LOCAL_RELACIONAL_DB_HOST,
    "projectId": process.env.FIREBASE_PROJECT_ID,
    "jwtSecret": process.env.JWT_SECRET,
    "dialect": "mysql"
  },
  "development": {
    "username": process.env.RELACIONAL_DB_USERNAME,
    "password": process.env.RELACIONAL_DB_PASS,
    "database": process.env.RELACIONAL_DB_NAME,
    "host": process.env.RELACIONAL_DB_HOST,
    "projectId": process.env.FIREBASE_PROJECT_ID,
    "jwtSecret": process.env.JWT_SECRET,
    "dialect": "mysql"
  },
  "production": {
    "username": process.env.RELACIONAL_DB_USERNAME,
    "password": process.env.RELACIONAL_DB_PASS,
    "database": process.env.RELACIONAL_DB_NAME,
    "host": process.env.RELACIONAL_DB_HOST,
    "projectId": process.env.FIREBASE_PROJECT_ID,
    "jwtSecret": process.env.JWT_SECRET,
    "dialect": "mysql"
  }
}