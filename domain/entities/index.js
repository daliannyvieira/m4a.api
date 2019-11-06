const fs = require('fs');
const path = require('path');
const Orm = require('sequelize');

const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
console.log('envvvvvv', env)
const config = require(`${__dirname  }/../../config/config.js`)[env];
const repository = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Orm(process.env[config.use_env_variable], config);
} else {
  sequelize = new Orm(config.database, config.username, config.password, config);
}

fs
  .readdirSync(__dirname)
  .filter((file) => (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js'))
  .forEach((file) => {
    const model = sequelize.import(path.join(__dirname, file));
    repository[model.name] = model;
  });

Object.keys(repository).forEach((modelName) => {
  if (repository[modelName].associate) {
    repository[modelName].associate(repository);
  }
});

repository.sequelize = sequelize;
repository.Orm = Orm;

module.exports = repository;
