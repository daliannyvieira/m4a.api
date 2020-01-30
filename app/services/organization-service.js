const { Organization, Interests } = require('../../domain/entities');
const { loggedUser } = require('../../domain/auth');
const { uploadImage, storageBucket } = require('../../infra/cloud-storage');
const { multer } = require('../../infra/helpers');
const orgFormat = require('../responses/orgs-long');

module.exports = class Initiatives {
  constructor(router) {
    this.router = router;
  }

  expose() {
    this.findOrganization();
    this.createOrganization();
    this.uploadAvatar();
    this.findCommitees();
    this.createCommitees();
  }

  createCommitees() {
    this.router.post('/organization/:orgId/committee', async (req, res) => {
      try {
        const user = await loggedUser(req);
        if (user) {
          let committee = req.body
          committee.idCommittee = req.params.orgId
          committee.idAdmin = user.id

          const data = await Organization.create(committee);
          if (req.body.interests) {
            await data.setInterests(req.body.interests);

            const org = await Organization.findOne({
              where: { id: data.id },
              include: [Interests],
            });
            return res.status(201).json({
              data: {
                type: 'Organization',
                id: data.id,
                attributes: orgFormat.format(data),
                relationships: {
                  interests: org.Interests && org.Interests.map((interest) => ({
                    id: interest.id,
                    description: interest.description,
                    type: interest.type,
                  })),
                },
              },
            });
          }
          return res.status(201).json({
            data: {
              type: 'Organization',
              id: data.id,
              attributes: orgFormat.format(data),
            },
          })
        }
        return res.status(404).json({
          errors: [{
            message: 'Didn’t find anything here!',
          }],
        });
      }
      catch (err) {
        console.log('err', err)
        res.status(500).json({
          errors: [err],
        });
      }
    });
  }

  findCommitees() {
    this.router.get('/organization/:orgId/committee', async (req, res) => {
      try {
        const data = await Organization.findOne({
          where: {
            id: req.params.orgId,
          },
          include: [
            Interests,
            {
              model: Organization,
              as: 'Committee',
              include: [Interests],
            },
          ],
        });
        return res.status(200).json({
          data: {
            type: 'Organization',
            id: data.id,
            attributes: orgFormat.format(data),
            relationships: {
              interests: data.Interests && data.Interests.map((interest) => ({
                id: interest.id,
                description: interest.description,
                type: interest.type,
              })),
              committees: data.Committee.map(committee => orgFormat.format(committee))
            }
          },
        })
      }
      catch (err) {
        console.log('err', err)
        res.status(500).json({
          errors: [err],
        });
      }
    });
  }

  findOrganization() {
    this.router.get('/organization/:organizationId', async (req, res) => {
      try {
        const data = await Organization.findOne({
          where: { id: req.params.organizationId },
          include: [Interests],
        });
        if (data) {
          return res.status(200).json({
            data: {
              type: 'Organization',
              id: data.id,
              attributes: orgFormat.format(data),
              relationships: {
                interests: data.Interests.map(interest => ({
                  id: interest.id,
                  description: interest.description,
                  type: interest.type,
                }))
              }
            },
          });
        }
        return res.status(404).json({
          errors: [{
            message: 'Didn’t find anything here!',
          }],
        });
      } catch (err) {
        res.status(500).json({
          errors: [err],
        });
      }
    });
  }

  createOrganization() {
    this.router.post('/organization', async (req, res) => {
      try {
        const user = await loggedUser(req); 

        let newOrg = req.body
        newOrg.idAdmin = user.id
        
        let data = await Organization.create(newOrg)

        if (req.body.interests) {
          await data.setInterests(req.body.interests);

          const org = await Organization.findOne({
            where: { id: data.id },
            include: [Interests],
          });
          return res.status(201).json({
            data: {
              type: 'Organization',
              id: data.id,
              attributes: orgFormat.format(data),
              relationships: {
                interests: org.Interests && org.Interests.map((interest) => ({
                  id: interest.id,
                  description: interest.description,
                  type: interest.type,
                })),
              },
            },
          });
        }

        return res.status(201).json({
          data: {
            type: 'Organization',
            id: data.id,
            attributes: orgFormat.format(data),
          },
        });
      }
      catch (err) {
        res.status(500).json({
          errors: [err],
        });
      }
    });
  }

  uploadAvatar() {
    this.router.post('/organization/:organizationId/avatar', multer.single('image'), async (req, res) => {
      try {
        if (req.file) {
          const user = await loggedUser(req);
          const { organizationId } = req.params;

          const org = await Organization.findOne({
            where: { id: organizationId },
          });
          if (org.idAdmin == user.id) {
            const image = await uploadImage(req.file, org.name);
            if (image) {
              const data = await org.update(
                { avatar: `https://${storageBucket}.storage.googleapis.com/${image}`, },
                { where: { id: org.id } },
              );
              return res.status(201).json({
                data: {
                  type: 'Organization',
                  id: data.id,
                  attributes: orgFormat.format(data),
                },
              });
            }
          }
          return res.status(403).json({
            errors: [{
              message: 'this organization is not yours',
            }],
          });
        }
        return res.status(404).json({
          errors: [{
            message: 'file not found',
          }],
        });
      }
      catch (err) {
        console.log('err', err)
        res.status(500).json({
          errors: [err],
        });
      }
    });
  }
};
