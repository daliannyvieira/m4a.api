const shortJson = {
  format: (initiative) => ({
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
    orgBeneficiary: initiative.orgBeneficiary,
    beneficiaries: initiative.beneficiaries,
    partners: initiative.partners,
    volunteersExpectation: initiative.volunteersExpectation,
    amountExpectation: initiative.amountExpectation,
  }),
};

module.exports = shortJson;
