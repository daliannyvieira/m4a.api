module.exports = (sequelize, DataTypes) => {
  const Interests = sequelize.define('Interests', {
    description: DataTypes.STRING,
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: {
          args: [['Fields', 'Causes',  'SDGs', 'Skills']],
          msg: "Type must be an 'Fields', 'Causes', 'SDGs' or 'Skills'"
        }
      }
    }
  });

  Interests.associate = models => {
    Interests.belongsToMany(models.User, {through: 'UsersInterests'})
  }

  return Interests;
}