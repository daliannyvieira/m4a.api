module.exports = (sequelize, DataTypes) => {
  const Matches = sequelize.define('Matches', {
    InitiativeId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    UserId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    liked: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
  });

  Matches.associate = (models) => {
    Matches.belongsTo(models.Initiative);
    Matches.belongsTo(models.User);
  };

  return Matches;
};
