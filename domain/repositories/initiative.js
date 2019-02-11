"use strict"
const Op = require('sequelize').Op;

const { Initiative, Interests, User } = require('../../domain/entities');

const createQuery = ({ country, state, city, UserId, IdMatches }) => {

  if (city) {
    return Initiative.findAll({
      where: { city: city, UserId: {$ne: UserId}, id: {[Op.notIn]:IdMatches} },
      include: [Interests]
    })
  }

  if (state) {
    return Initiative.findAll({
      where: { state: state, UserId: {$ne: UserId}, id: {[Op.notIn]:IdMatches} },
      include: [Interests]
    })
  }

  if (country) {
    return Initiative.findAll({
      where: { country: country, UserId: {$ne: UserId}, id: {[Op.notIn]:IdMatches} },
      include: [Interests]
    })
  }

  if (!city && !state && !country) {
    return Initiative.findAll({
      where: { UserId: {$ne: UserId}, id: {[Op.notIn]:IdMatches} },
      include: [Interests]
    })
  }
}

const searchNearestInitiatives = async ({ country, state, city, UserId, IdMatches }) => {
  const query = createQuery({ country, state, city, UserId, IdMatches})

  let result = await query

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
      UserId: currentUser.id,
      IdMatches: currentUser.Initiatives.map(item => item.id)
    })
    return result
  }
}