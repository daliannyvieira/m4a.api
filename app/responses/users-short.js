const UsersShort = {
  format: (user) => ({
    type: 'User',
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
    },
  }),
};

module.exports = UsersShort;
