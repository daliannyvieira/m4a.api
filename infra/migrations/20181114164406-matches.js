module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.createTable('Matches', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
    },
    InitiativeId: {
      type: Sequelize.INTEGER,
      references: { model: 'Initiatives', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    UserId: {
      type: Sequelize.INTEGER,
      references: { model: 'Users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    liked: {
      type: Sequelize.BOOLEAN,
    },
    muted: {
      type: Sequelize.BOOLEAN,
    },
    createdAt: {
      type: Sequelize.DATE,
    },
    updatedAt: {
      type: Sequelize.DATE,
    },
  }),

  down: (queryInterface) => queryInterface.dropTable('Matches'),
};
