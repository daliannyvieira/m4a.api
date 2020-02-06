const longJson = {  
  format: (initiative) => {
    return {
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
      orgId: initiative.OrganizationId,
      createdAt: initiative.createdAt,
      updatedAt: initiative.updatedAt,
    }
  }
}

module.exports = longJson;