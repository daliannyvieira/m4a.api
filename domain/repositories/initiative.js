"use strict"
const Op = require('sequelize').Op;

const { Initiative, Interests, User } = require('../../domain/entities');

const createQuery = ({ country, city, UserId, IdMatches }) => {

  if (city) {
    return Initiative.findAll({
      where: { city: city, UserId: {$ne: UserId}, id: {[Op.notIn]:IdMatches} },
      include: [Interests]
    })
  }

  if (country) {
    return Initiative.findAll({
      where: { country: country, UserId: {$ne: UserId}, id: {[Op.notIn]:IdMatches} },
      include: [Interests]
    })
  }

  return Initiative.findAll({
    where: { UserId: {$ne: UserId}, id: {[Op.notIn]:IdMatches} },
    include: [Interests]
  })
}

const searchNearestInitiatives = async ({ country, city, UserId, IdMatches }) => {
  let search = null

  // Search initiatives by city
  let result = await createQuery({ country, city, UserId, IdMatches})

  // Search initiatives by country
  if (result.length < 10) {
    search = 'country'
    result = await createQuery({ country, UserId, IdMatches})
  }

  // Search all initiatives
  if (result.length < 10 && search === 'country') {
    search = 'all'
    result = await createQuery({ UserId, IdMatches})
  }

  return result
} 

module.exports = class InitiativeRepository {
  async findNearest(currentUser) {
    const result = await searchNearestInitiatives({
      country: currentUser.country,
      city: currentUser.city,
      UserId: currentUser.id,
      IdMatches: currentUser.Initiatives.map(item => item.id)
    })
    return result
  }
}