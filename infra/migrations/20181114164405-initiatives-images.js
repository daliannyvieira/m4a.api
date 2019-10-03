'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('InitiativesImages', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      image: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      name: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      createdAt: {
        type: Sequelize.DATE,
      },
      updatedAt: {
        type: Sequelize.DATE,
      },
      InitiativeId: {
        type: Sequelize.INTEGER,
        references: { model: 'Initiatives', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
    });
  },

  down: (queryInterface) => {
    return queryInterface.dropTable('InitiativesImages');
  }
};
