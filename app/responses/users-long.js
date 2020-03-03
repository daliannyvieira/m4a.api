const UsersLong = {
  format: (user) => ({
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
    partner: user.partner,
    partnerVinculo: user.partnerVinculo,
  }),
};

module.exports = UsersLong;
