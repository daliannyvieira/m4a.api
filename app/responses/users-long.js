const UsersLong = {
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
        updatedAt: user.updatedAt
      }
    }
  }
}

module.exports = UsersLong;