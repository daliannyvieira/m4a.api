module.exports = (sequelize, DataTypes) => {
  const Member = sequelize.define('Member', {
    OrganizationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    UserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    permission: {
      type: DataTypes.STRING,
    },
  });

  Member.associate = (models) => {
    Member.belongsTo(models.Organization);
    Member.belongsTo(models.User);
  };

  return Member;
};
