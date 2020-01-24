const UsersLong = {
  format: (user) => {
    return {
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
      valeVinculo: user.valeVinculo,
    }
  }
}

module.exports = UsersLong;