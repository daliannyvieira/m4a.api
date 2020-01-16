const { Organization, Interests } = require('../../domain/entities');
const { loggedUser } = require('../../domain/auth');
const { uploadImage, bucket } = require('../../infra/cloud-storage');
const { multer } = require('../../infra/helpers');

module.exports = class Initiatives {
  constructor(router) {
    this.router = router;
  }

  expose() {
    this.findOrganizations();
    this.createOrganization();
    this.uploadAvatar();
  }

  findOrganizations() {
    this.router.get('/organization', async (req, res) => {
      try {
        res.status(200).json({
          data: await Organization.findAll().map((org) => {
            return {
              type: 'Organization',
              id: org.id,
              attributes: org
            }
          }),
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
        newOrg.id_admin = user.id
        
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
              attributes: data,
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
            attributes: data
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
          if (org.id_admin == user.id) {
            const image = await uploadImage(req.file, org.name);
            if (image) {
              const data = await org.update(
                { avatar: `https://${bucket}.storage.googleapis.com/${image}`, },
                { where: { id: org.id } },
              );
              return res.status(201).json({
                data: {
                  type: 'Organization',
                  id: data.id,
                  attributes: data,
                },
              });
            }
          }
          return res.status(403).json({
            errors: [{
              message: 'this initiative is not yours',
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
