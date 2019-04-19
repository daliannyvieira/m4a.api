const shortJson = {
  format: (initiative) => {
    return {
      type: `Initiative`,
      id: initiative.id,
      attributes: {
        name: initiative.name,
        website: initiative.website,
        address: initiative.address,
        start: initiative.start,
        finish: initiative.finish,
        avatar: initiative.avatar,
        bio: initiative.bio,
        country: initiative.country,
        city: initiative.city,
        userId: initiative.UserId,
        interests: initiative.Interests && initiative.Interests.map(interest => ({
          id: interest.id,
          description: interest.description,
          type: interest.type
        })),
        images: initiative.InitiativesImages && initiative.InitiativesImages.map(img => ({
          id: img.id,
          image: img.image
        }))
      }
    }
  }
}

module.exports = shortJson;