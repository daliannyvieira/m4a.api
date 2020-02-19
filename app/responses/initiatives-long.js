const longJson = {
  format: (initiative, ownerName) => ({
    id: initiative.id,
    name: initiative.name,
    website: initiative.website,
    bio: initiative.bio,
    birthday: initiative.birthday,
    avatar: initiative.avatar,
    country: initiative.country,
    state: initiative.state,
    city: initiative.city,
    address: initiative.address,
    zipcode: initiative.zipcode,
    latlong: initiative.latlong,
    eventType: initiative.eventType,
    start: initiative.start,
    finish: initiative.finish,
    ownerType: initiative.ownerType,
    ownerName: ownerName && ownerName,
    userId: initiative.UserId,
    orgId: initiative.OrganizationId,
    createdAt: initiative.createdAt,
    updatedAt: initiative.updatedAt,
    orgBeneficiary: initiative.orgBeneficiary,
    beneficiaries: initiative.beneficiaries,
    partners: initiative.partners,
    volunteersExpectation: initiative.volunteersExpectation,
    amountExpectation: initiative.amountExpectation,
    relationships: {
      interests: initiative.Interests && initiative.Interests.map((interest) => ({
        id: interest.id,
        description: interest.description,
        type: interest.type,
      })),
      images: initiative.InitiativesImages && initiative.InitiativesImages.map((img) => ({
        id: img.id,
        image: img.image,
      })),
    },
  }),
};

module.exports = longJson;
