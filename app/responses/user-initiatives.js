const Initiatives = {
  format: (user) => ({
    usersInitiatives: user.UserInitiatives && user.UserInitiatives.map((initiative) => ({
      id: initiative.id,
      name: initiative.name,
      website: initiative.website,
      bio: initiative.bio,
      avatar: initiative.avatar,
      images: initiative.InitiativesImages && initiative.InitiativesImages.map((img) => ({
        id: img.id,
        img: img.image,
      })),
    })),
    matches: user.Initiatives && user.Initiatives.map((initiative) => ({
      id: initiative.id,
      name: initiative.name,
      website: initiative.website,
      bio: initiative.bio,
      avatar: initiative.avatar,
      images: initiative.InitiativesImages && initiative.InitiativesImages.map((img) => ({
        id: img.id,
        img: img.image,
      })),
    })),
  }),
};

module.exports = Initiatives;
