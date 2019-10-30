module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Initiatives', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name: {
        type: Sequelize.STRING,
        unique: true,
      },
      website: {
        type: Sequelize.STRING,
      },
      bio: {
        type: Sequelize.STRING,
      },
      birthday: {
        type: Sequelize.DATE,
      },
      avatar: {
        type: Sequelize.STRING,
      },
      country: {
        type: Sequelize.STRING,
      },
      state: {
        type: Sequelize.STRING,
      },
      city: {
        type: Sequelize.STRING,
      },
      address: {
        type: Sequelize.STRING,
      },
      latlong: {
        type: Sequelize.GEOMETRY('POINT', 4326),
      },
      zipcode: {
        type: Sequelize.STRING,
      },
      eventType: {
        type: Sequelize.STRING,
      },
      start: {
        type: Sequelize.DATE,
      },
      finish: {
        type: Sequelize.DATE,
      },
      createdAt: {
        type: Sequelize.DATE,
      },
      updatedAt: {
        type: Sequelize.DATE,
      },
      muted: {
        type: Sequelize.BOOLEAN,
      },
      UserId: {
        type: Sequelize.INTEGER,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
    });

    queryInterface.addIndex('Initiatives', [
      'country', 'state', 'city',
    ]);
  },

  down: (queryInterface) => queryInterface.dropTable('Initiatives'),
};
