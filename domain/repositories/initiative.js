const { Op } = require('sequelize');

const {
  Initiative, Interests, InitiativesImages,
} = require('../../domain/entities');

const createQuery = ({
  country, city, UserId, IdMatches,
}) => {
  if (city) {
    return Initiative.findAll({
      where: {
        city,
        UserId: {
          [Op.not]: UserId,
        },
        id: {
          [Op.not]: IdMatches,
        },
      },
      include: [Interests, InitiativesImages],
    });
  }
  if (country) {
    return Initiative.findAll({
      where: {
        country,
        UserId: {
          [Op.not]: UserId,
        },
        id: {
          [Op.not]: IdMatches,
        },
      },
      include: [Interests, InitiativesImages],
    });
  }
  return Initiative.findAll({
    where: {
      UserId: {
        [Op.not]: UserId,
      },
      id: {
        [Op.not]: IdMatches,
      },
    },
    include: [Interests, InitiativesImages],
  });
};

const searchNearestInitiatives = async ({
  country, city, UserId, IdMatches,
}) => {
  let search = null;

  // Search initiatives by city
  let result = await createQuery({
    country, city, UserId, IdMatches,
  });

  // Search initiatives by country
  if (result.length < 10) {
    search = 'country';
    result = await createQuery({ country, UserId, IdMatches });
  }

  // Search all initiatives
  if (result.length < 10 && search === 'country') {
    search = 'all';
    result = await createQuery({ UserId, IdMatches });
  }

  return result;
};

module.exports = class InitiativeRepository {
  async findNearest(currentUser, IdMatches) {
    const result = await searchNearestInitiatives({
      country: currentUser.country,
      city: currentUser.city,
      UserId: currentUser.id,
      IdMatches: IdMatches,
    });
    return result;
  }
};
