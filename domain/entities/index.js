'use strict';

const fs = require('fs');
const path = require('path');
const orm = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../../config/config.js')[env];
const repository = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new orm(process.env[config.use_env_variable], config);
} else {
  sequelize = new orm(config.database, config.username, config.password, config);
}

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    const model = sequelize['import'](path.join(__dirname, file));
    repository[model.name] = model;
  });

Object.keys(repository).forEach(modelName => {
  if (repository[modelName].associate) {
    repository[modelName].associate(repository);
  }
});

repository.sequelize = sequelize;
repository.orm = orm;

module.exports = repository;