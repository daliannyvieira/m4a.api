module.exports = (sequelize, DataTypes) => {
  const Interests = sequelize.define('Interests', {
    description: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        msg: 'description must be unique',
      },
      validate: {
        notEmpty: {
          msg: "description can't be empty",
        },
      },
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: {
          args: [['Fields', 'Causes', 'SDGs', 'Skills']],
          msg: "Type must be an 'Fields', 'Causes', 'SDGs' or 'Skills'",
        },
      },
    },
  });

  Interests.associate = (models) => {
    Interests.belongsToMany(models.User, { through: 'UsersInterests' });
  };

  return Interests;
};
