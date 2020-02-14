module.exports = (sequelize, DataTypes) => {
  const Initiative = sequelize.define('Initiative', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        msg: 'name must be unique',
      },
      validate: {
        notEmpty: {
          msg: "name can't be empty",
        },
      },
    },
    website: {
      type: DataTypes.STRING,
      validate: {
        notEmpty: {
          msg: "website can't be empty",
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
    eventType: {
      type: DataTypes.STRING,
      validate: {
        isIn: {
          args: [['on going', 'one time']],
          msg: "eventType must be: 'on going' or 'one time'",
        },
      },
    },
    start: DataTypes.DATE,
    finish: DataTypes.DATE,
    muted: {
      type: DataTypes.BOOLEAN,
    },
    UserId: DataTypes.INTEGER,
    ownerType: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "ownerType can't be empty",
        },
        isIn: {
          args: [['user', 'organization', 'committee']],
          msg: "ownerType must be: 'user', 'organization' or 'committee'",
        },
      },
    },
    OrganizationId: DataTypes.INTEGER,
    orgBeneficiary: DataTypes.STRING,
    beneficiaries: DataTypes.INTEGER,
    partners: DataTypes.STRING,
    volunteersExpectation: DataTypes.INTEGER,
    amountExpectation: DataTypes.INTEGER,
  },
  {
    paranoid: true,
    timestamps: true,
  });

  Initiative.associate = (models) => {
    Initiative.belongsTo(models.User);
    Initiative.belongsTo(models.Organization);
    Initiative.hasMany(models.InitiativesImages, { foreignKey: 'InitiativeId' });
    Initiative.belongsToMany(models.Interests, { through: 'InitiativesInterests' });
    Initiative.belongsToMany(models.User, { through: 'Matches' });
  };

  return Initiative;
};
