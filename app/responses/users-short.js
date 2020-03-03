const UsersShort = {
  format: (user) => ({
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    bio: user.bio,
    country: user.country,
    city: user.city,
    allowToRemote: user.allowToRemote,
    userProfile: user.userProfile,
  }),
};

module.exports = UsersShort;
