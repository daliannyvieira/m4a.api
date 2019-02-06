'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('InitiativesInterests', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      InterestId: {
        type: Sequelize.INTEGER,
        references: { model: 'Interests', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      InitiativeId: {
        type: Sequelize.INTEGER,
        references: { model: 'Initiatives', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      createdAt: {
        type: Sequelize.DATE,
      },
      updatedAt: {
        type: Sequelize.DATE,
      }
    });
  },
  down: (queryInterface) => {
    return queryInterface.dropTable('InitiativesInterests');
  }
};