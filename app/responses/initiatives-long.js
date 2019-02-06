const longJson = {  
  format: (initiative) => {
    return {
      type: `Initiative`,
      id: initiative.id,
      attributes: {
        name: initiative.name,
        website: initiative.website,
        bio: initiative.bio,
        birthday: initiative.birthday,
        avatar: initiative.avatar,
        country: initiative.country,
        state: initiative.state,
        city: initiative.city,
        address: initiative.address,
        zipcode: initiative.zipcode,
        latlong: initiative.latlong,
        eventType: initiative.eventType,
        start: initiative.start,
        finish: initiative.finish,
        userId: initiative.UserId,
        createdAt: initiative.createdAt,
        updatedAt: initiative.updatedAt,
        relationships: {
          interests: initiative.Interests && initiative.Interests.map(interest => ({
            id: interest.id,
            description: interest.description,
            type: interest.type
          }))
        }
      }
    }
  }
}

module.exports = longJson;