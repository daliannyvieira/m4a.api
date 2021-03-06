const UsersRelationship = {
  format: (user) => {
    return {
      type: `User`,
      id: user.id,
      attributes: {
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        birthday: user.birthday,
        zipcode: user.zipcode,
        latlong: user.latlong,
        address: user.address,
        state: user.state,
        city: user.city,
        country: user.country,
        allowToRemote: user.allowToRemote,
        userStatus: user.userStatus,
        userProfile: user.userProfile,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        interests: user.Interests && user.Interests.map(interest => ({
          id: interest.id,
          description: interest.description,
          type: interest.type,
        }))
      },
      relationships: {
        matches: user.Initiatives && user.Initiatives.map(initiative => ({
          id: initiative.id,
          name: initiative.name,
          website: initiative.website,
          bio: initiative.bio,
          avatar: initiative.avatar
        })),
        usersInitiatives: user.UserInitiatives && user.UserInitiatives.map(initiative => ({
          id: initiative.id,
          name: initiative.name,
          website: initiative.website,
          bio: initiative.bio,
          avatar: initiative.avatar
        }))
      }
    }
  }
}

module.exports = UsersRelationship;