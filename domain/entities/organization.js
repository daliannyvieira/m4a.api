module.exports = (sequelize, DataTypes) => {
  const Organization = sequelize.define('Organization', {
    name: DataTypes.STRING,
    bio: DataTypes.STRING,
    id_admin: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        msg: 'email must be unique',
      },
    },
    email: DataTypes.STRING,
    birthday: DataTypes.DATE,
    avatar: DataTypes.STRING,
    country: DataTypes.STRING,
    city: DataTypes.STRING,
    address: DataTypes.STRING,
    latlong: DataTypes.GEOMETRY('POINT', 4326),
    zipcode: DataTypes.STRING,
  });

  Organization.associate = (models) => {
    Organization.belongsTo(models.User, { foreignKey: 'id_admin'});
    Organization.belongsToMany(models.Interests, { through: 'OrganizationsInterests' });
  };

  return Organization;
};
