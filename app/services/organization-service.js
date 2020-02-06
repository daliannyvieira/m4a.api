const { Organization } = require('../../domain/entities');
const { loggedUser } = require('../../domain/auth');
const { uploadImage, storageBucket, getImage, deleteImage} = require('../../infra/cloud-storage');
const { multer } = require('../../infra/helpers');
const orgFormat = require('../responses/orgs-long');
const { Op } = require('sequelize');

module.exports = class Initiatives {
  constructor(router) {
    this.router = router;
  }

  expose() {
    this.findOrganization();
    this.createOrganization();
    this.uploadImageOrg();
    this.findCommittees();
    this.createCommitees();
    this.findCommittee();
  }

  createCommitees() {
    this.router.post('/organization/:idOrg/committee', async (req, res) => {
      try {
        const user = await loggedUser(req);
        if (user) {
          let committee = req.body
          committee.OrganizationId = req.params.idOrg
          committee.idAdmin = user.id

          const org = await Organization.create(committee);
          if (org) {
            return res.status(201).json({
              org: {
                type: 'Committee',
                id: org.id,
                attributes: orgFormat.format(org),
              },
            })
          }
        }
        return res.status(404).json({
          errors: [{
            message: 'Didn’t find anything here!',
          }],
        });
      }
      catch (err) {
        let errors = []
        if (err.name === 'SequelizeForeignKeyConstraintError') {
          errors.push({
            title: "You can't create a committee using this id",
            detail: err
          })
        }
        else {
          errors.push({
            title: err.errors.find(erro => erro.message).message,
            detail: err
          })
        }
        res.status(500).json({
          errors
        });
      }
    });
  }

  findCommittees() {
    this.router.get('/organization/:orgId/committee', async (req, res) => {
      try {
        const data = await Organization.findOne({
          where: {
            id: req.params.orgId,
          },
          include: [
            {
              model: Organization,
              as: 'Committee',
            },
          ],
        });
        if (data) {
          return res.status(200).json({
            data: {
              type: 'Organization',
              id: data.id,
              attributes: orgFormat.format(data),
              relationships: {
                committees: data.Committee.map(committee => orgFormat.format(committee))
              }
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

  findOrganization() {
    this.router.get('/organization/:organizationId', async (req, res) => {
      try {
        const data = await Organization.findOne({
          where: {
            id: req.params.organizationId,
            OrganizationId: null,
          },
        });
        if (data) {
          return res.status(200).json({
            data: {
              type: 'Organization',
              id: data.id,
              attributes: orgFormat.format(data),
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

  findCommittee() {
    this.router.get('/committee/:committeeId', async (req, res) => {
      try {
        const data = await Organization.findOne({
          where: {
            id: req.params.committeeId,
            OrganizationId: {
              [Op.not]: null,
            },
          },
        });
        if (data) {
          return res.status(200).json({
            data: {
              type: 'Committee',
              id: data.id,
              attributes: orgFormat.format(data),
            },
          });
        }
        return res.status(404).json({
          errors: [{
            message: 'Didn’t find anything here!',
          }],
        });
      } catch (err) {
        console.log('err', err)
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

        if (user) {
          let newOrg = req.body
          newOrg.idAdmin = user.id

          let data = await Organization.create(newOrg)

          return res.status(201).json({
            data: {
              type: 'Organization',
              id: data.id,
              attributes: orgFormat.format(data),
            },
          });
        }
        return res.status(404).json({
          errors: [{
            message: 'user not found',
          }],
        });
      }
      catch (err) {
        console.log(err)
        res.status(500).json({
          errors: [err],
        });
      }
    });
  }

  uploadImageOrg() {
    this.router.post('/organization/:organizationId/avatar', multer.single('image'), async (req, res) => {
      try {
        if (req.file) {
          const user = await loggedUser(req);
          const org = await Organization.findOne({
            where: {
              id: req.params.organizationId
            },
          });

          if (org && org.idAdmin == user.id) {
            if (org.avatar !== null) {
              await deleteImage(org.avatar.split("/").pop())
            }
            const image = await uploadImage(req.file, `org_${org.name}`);
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
          if (!org) {
            return res.status(404).json({
              errors: [{
                message: 'Didn’t find anything here!',
              }],
            });
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
