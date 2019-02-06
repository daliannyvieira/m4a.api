const UsersShort = {
  format: (user) => {
    return {
      type: `User`,
      id: user.id,
      attributes: {
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        country: user.country,
        city: user.city,
        allowToRemote: user.allowToRemote,
        userProfile: user.userProfile,
        interests: user.Interests && user.Interests.map(interest => ({
          id: interest.id,
          description: interest.description,
          type: interest.type
        }))
      }
    }
  }
}

module.exports = UsersShort;