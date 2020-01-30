const longJson = {
  format: (org) => {
    if (org.Interests) {
      return {
        name: org.name,
        bio: org.bio,
        idAdmin: org.idAdmin,
        email: org.email,
        birthday: org.birthday,
        avatar: org.avatar,
        country: org.country,
        city: org.city,
        address: org.address,
        latlong: org.latlong,
        zipcode: org.zipcode,
        relationships: {
          interests: org.Interests && org.Interests.map((interest) => ({
            id: interest.id,
            description: interest.description,
            type: interest.type,
          })),
        },
      }
    }
    return {
      name: org.name,
      bio: org.bio,
      idAdmin: org.idAdmin,
      email: org.email,
      birthday: org.birthday,
      avatar: org.avatar,
      country: org.country,
      city: org.city,
      address: org.address,
      latlong: org.latlong,
      zipcode: org.zipcode,
    }
  }
}

module.exports = longJson;