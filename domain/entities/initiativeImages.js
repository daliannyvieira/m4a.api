module.exports = (sequelize, DataTypes) => {
  const InitiativesImages = sequelize.define('InitiativesImages', {
    description: DataTypes.STRING,
    image: {
      type: DataTypes.STRING,
      allowNull: false
    },
    InitiativeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "InitiativeId can't be empty"
        }
      }
    }
  });

  InitiativesImages.associate = models => {
    InitiativesImages.belongsTo(models.Initiative);
  };

  return InitiativesImages;
}