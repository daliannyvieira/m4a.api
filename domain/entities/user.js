module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "name can't be empty",
        },
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        msg: 'email must be unique',
      },
      validate: {
        notEmpty: {
          msg: "email can't be empty",
        },
        isEmail: {
          msg: 'email must be an email',
        },
      },
    },
    bio: {
      type: DataTypes.STRING,
      validate: {
        len: {
          args: [0, 100],
          msg: 'bio must have until 100 characters',
        },
      },
    },
    birthday: DataTypes.DATE,
    avatar: DataTypes.STRING,
    country: DataTypes.STRING,
    state: DataTypes.STRING,
    city: DataTypes.STRING,
    address: DataTypes.STRING,
    latlong: DataTypes.GEOMETRY('POINT', 4326),
    zipcode: DataTypes.STRING,
    facebookId: DataTypes.STRING,
    allowToRemote: DataTypes.INTEGER,
    userProfile: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: {
          args: [['Organization', 'Volunteer']],
          msg: 'userProfile must be an Organization or a Volunteer using lowercase',
        },
      },
    },
    userStatus: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      validate: {
        isIn: {
          args: [[0, 1]],
          msg: 'userStatus must be 0 or 1',
        },
      },
    },
    valeVinculo: DataTypes.STRING,
  },
    {
      paranoid: true,
      timestamps: true
    }
  );

  User.associate = (models) => { 
    User.hasMany(models.Initiative, { foreignKey: 'UserId', as: 'UserInitiatives' });

    User.hasMany(models.Organization, { foreignKey: 'idAdmin', as: 'userOrganizations' });

    User.belongsToMany(models.Interests, { through: 'UsersInterests' });

    User.belongsToMany(models.Initiative, { through: 'Matches' });
  };
  return User;
};
