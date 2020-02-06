const longJson = {
  format: (org) => {
    return {
      name: org.name,
      bio: org.bio,
      idAdmin: org.idAdmin,
      idOrg: org.idOrg && parseInt(org.idOrg),
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