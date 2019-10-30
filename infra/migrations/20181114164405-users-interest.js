module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.createTable('UsersInterests', {
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
      onDelete: 'CASCADE'
    },
    UserId: {
      type: Sequelize.INTEGER,
      references: { model: 'Users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    createdAt: {
      type: Sequelize.DATE,
    },
    updatedAt: {
      type: Sequelize.DATE,
    },
  }),

  down: (queryInterface) => queryInterface.dropTable('UsersInterests'),
};
