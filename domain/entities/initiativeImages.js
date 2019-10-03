module.exports = (sequelize, DataTypes) => {
  const InitiativesImages = sequelize.define('InitiativesImages', {
    image: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    InitiativeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "InitiativeId can't be empty",
        },
      },
    },
  });

  InitiativesImages.associate = (models) => {
    InitiativesImages.belongsTo(models.Initiative);
  };

  return InitiativesImages;
};
