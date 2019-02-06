"use strict"

const { Initiative } = require('../../domain/entities');

const createQuery = ({ country, state, city, UserId }) => {
  if (city) {
    return `select * from Initiatives
            where country = '${country}'
            and state = '${state}'
            and city = '${city}'
            and UserId <> '${UserId}'`
  }

  if (state) {
    return `select * from Initiatives
            where country = '${country}'
            and state = '${state}'
            and UserId <> '${UserId}'`
  }
  if (country) {
    return `select * from Initiatives
            where country = '${country}
            and UserId <> '${UserId}'`
  }
  return `select * from Initiatives`
}

const searchNearestInitiatives = async ({ country, state, city, UserId }) => {
  const query = createQuery({ country, state, city, UserId})

  let result = await Initiative.sequelize.query(query, {
    raw: true
  })

  // city not found? search again
  if (result[0].length === 0 && city != null) {
    result = await searchNearestInitiatives({ country, state, city: null })
  }

  // state not found? search again
  if (result[0].length === 0 && state != null) {
    result = await searchNearestInitiatives({ country, state: null, city: null })
  }

  // country not found? search again
  if (result[0].length === 0 && country != null) {
    result = await searchNearestInitiatives({
      country: null,
      state: null,
      city: null
    })
  }
  // nothing found? return universe :)
  return result
}

module.exports = class InitiativeRepository {
  async findNearest(currentUser) {
    const result = await searchNearestInitiatives({
      country: currentUser.country,
      state: currentUser.state,
      city: currentUser.city,
      UserId: currentUser.id
    })
    return result[0]
  }
}