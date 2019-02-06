module.exports = (sequelize, DataTypes) => {
  const Interests = sequelize.define('Interests', {
    description: DataTypes.STRING,
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: {
          args: [['Areas', 'Causes',  'SDG', 'Skills']],
          msg: "type must be a 'Areas', 'Causes', 'SDG' or 'Skills'"
        }
      }
    }
  });

  Interests.associate = models => {
    Interests.belongsToMany(models.User, {through: 'UsersInterests'})
  }

  return Interests;
}