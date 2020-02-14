module.exports = (sequelize, DataTypes) => {
  const Organization = sequelize.define('Organization', {
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
    bio: DataTypes.STRING,
    idAdmin: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      unique: {
        msg: 'email must be unique',
      },
      validate: {
        isEmail: {
          msg: 'email must be an email',
        },
      },
    },
    birthday: DataTypes.DATE,
    avatar: DataTypes.STRING,
    country: DataTypes.STRING,
    city: DataTypes.STRING,
    address: DataTypes.STRING,
    latlong: DataTypes.GEOMETRY('POINT', 4326),
    zipcode: DataTypes.STRING,
    OrganizationId: DataTypes.INTEGER,
  },
  {
    paranoid: true,
    timestamps: true,
  });


  Organization.associate = (models) => {
    Organization.hasMany(models.Member, {
      foreignKey: 'OrganizationId',
      as: 'OrganizationMembers',
    });

    Organization.hasMany(models.Initiative, { foreignKey: 'OrganizationId', as: 'OrganizationInitiatives' });
    Organization.belongsTo(models.User, { foreignKey: 'idAdmin' });
    Organization.hasMany(Organization, {
      as: 'Committee',
      foreignKey: 'OrganizationId',
      useJunctionTable: false,
    });
    Organization.hasOne(Organization, {
      as: 'Organization',
      foreignKey: 'OrganizationId',
      useJunctionTable: false,
    });
  };

  return Organization;
};
