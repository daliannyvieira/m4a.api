const { Op } = require('sequelize');
const {
  Organization, Initiative, InitiativesImages, Interests, Member, User
} = require('../../domain/entities');
const { loggedUser } = require('../../domain/auth');
const {
  uploadImage, storageBucket, deleteImage,
} = require('../../infra/cloud-storage');
const { multer } = require('../../infra/helpers');
const orgFormat = require('../responses/orgs-long');
const initFormat = require('../responses/initiatives-long.js');

module.exports = class Initiatives {
  constructor(router) {
    this.router = router;
  }

  expose() {
    this.findOrganization();
    this.createOrganization();
    this.uploadImageOrg();
    this.uploadImageCommittee();
    this.findCommittees();
    this.createCommitees();
    this.findCommittee();
    this.findOrgInitiatives();
    this.findCommitteeInitiatives();
    this.createMember();
    this.findMembers();
  }

  createCommitees() {
    this.router.post('/organization/:idOrg/committee', async (req, res) => {
      try {
        const user = await loggedUser(req);
        if (user) {
          const committee = req.body;
          committee.OrganizationId = req.params.idOrg;
          committee.idAdmin = user.id;

          const org = await Organization.create(committee);
          if (org) {
            return res.status(201).json({
              org: {
                type: 'Committee',
                id: org.id,
                attributes: orgFormat.format(org),
              },
            });
          }
        }
        return res.status(404).json({
          errors: [{
            message: 'Didn’t find anything here!',
          }],
        });
      } catch (err) {
        const errors = [];
        if (err.name === 'SequelizeForeignKeyConstraintError') {
          errors.push({
            title: "You can't create a committee using this id",
            detail: err,
          });
        } else {
          errors.push({
            title: err.errors.find((erro) => erro.message).message,
            detail: err,
          });
        }
        return res.status(500).json({
          errors,
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
            data: data.Committee.map(((init) => ({
              type: 'Initiative',
              id: init.id,
              attributes: orgFormat.format(init),
            }))),
          });
        }
        return res.status(404).json({
          errors: [{
            message: 'Didn’t find anything here!',
          }],
        });
      } catch (err) {
        console.log('err', err);
        return res.status(500).json({
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
        return res.status(500).json({
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
        console.log('err', err);
        return res.status(500).json({
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
          const newOrg = req.body;
          newOrg.idAdmin = user.id;

          const data = await Organization.create(newOrg);

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
      } catch (err) {
        console.log(err);
        return res.status(500).json({
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
              id: req.params.organizationId,
            },
          });

          if (org && org.idAdmin == user.id) {
            if (org.avatar !== null) {
              await deleteImage(org.avatar.split('/').pop());
            }
            const image = await uploadImage(req.file, `org_${org.name}`);
            const data = await org.update(
              { avatar: `https://${storageBucket}.storage.googleapis.com/${image}` },
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
      } catch (err) {
        console.log('err', err);
        return res.status(500).json({
          errors: [err],
        });
      }
    });
  }

  uploadImageCommittee() {
    this.router.post('/committee/:committeeId/avatar', multer.single('image'), async (req, res) => {
      try {
        if (req.file) {
          const user = await loggedUser(req);
          const org = await Organization.findOne({
            where: {
              id: req.params.committeeId,
              OrganizationId: {
                [Op.not]: null,
              },
            },
          });
          if (org && user && org.idAdmin == user.id) {
            if (org.avatar !== null) {
              await deleteImage(org.avatar.split('/').pop());
            }
            const image = await uploadImage(req.file, `org_${org.name}`);
            const data = await org.update(
              { avatar: `https://${storageBucket}.storage.googleapis.com/${image}` },
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
              org,
              user,
              message: 'this organization is not yours',
            }],
          });
        }
        return res.status(404).json({
          errors: [{
            message: 'file not found',
          }],
        });
      } catch (err) {
        console.log('err', err);
        return res.status(500).json({
          errors: [err],
        });
      }
    });
  }

  findOrgInitiatives() {
    this.router.get('/organization/:orgId/initiatives', async (req, res) => {
      try {
        const organization = await Organization.findOne({
          where: {
            id: req.params.orgId,
            OrganizationId: null,
          },
          include: [
            {
              model: Initiative,
              as: 'OrganizationInitiatives',
              include: [InitiativesImages, Interests],
            },
          ],
        });
        if (organization) {
          return res.status(200).json({
            data: {
              type: 'Organization',
              id: organization.id,
              attributes: orgFormat.format(organization),
              relationships: {
                initiatives: organization.OrganizationInitiatives.map((init) => ({
                  type: 'Initiative',
                  id: init.id,
                  attributes: initFormat.format(init),
                })),
              },
            },
          });
          // return res.status(200).json({
          // data: data.map(((init) => ({
          //   type: 'Initiative',
          //   id: init.id,
          //   attributes: initFormat.format(init),
          // }))),
          // });
        }
        return res.status(404).json({
          errors: [{
            message: 'Didn’t find anything here!',
          }],
        });
      } catch (err) {
        console.log('err', err);
        return res.status(500).json({
          errors: [err],
        });
      }
    });
  }

  findCommitteeInitiatives() {
    this.router.get('/committee/:committeeId/initiatives', async (req, res) => {
      try {
        const committee = await Organization.findOne({
          where: {
            id: req.params.committeeId,
            OrganizationId: {
              [Op.not]: null,
            },
          },
          include: [
            {
              model: Initiative,
              as: 'OrganizationInitiatives',
              include: [InitiativesImages, Interests],
            },
          ],
        });
        if (committee) {
          return res.status(200).json({
            data: {
              type: 'Organization',
              id: committee.id,
              attributes: orgFormat.format(committee),
              relationships: {
                initiatives: committee.OrganizationInitiatives.map((init) => ({
                  type: 'Initiative',
                  id: init.id,
                  attributes: initFormat.format(init),
                })),
              },
            },
          });
        }
        return res.status(404).json({
          errors: [{
            message: 'Didn’t find anything here!',
          }],
        });
      } catch (err) {
        console.log('err', err);
        return res.status(500).json({
          errors: [err],
        });
      }
    });
  }

  createMember() {
    this.router.post('/organization/:orgId/member', async (req, res) => {
      try {
        const { email } = req.body;
        const user = await User.findOne({
          where: {
            email,
          },
        });
        if (user) {
          return res.status(201).json({
            data: await Member.create({
              OrganizationId: req.params.orgId,
              UserId: user.id,
            }),
          });
        }
        return res.status(404).json({
          errors: [{
            message: 'Didn’t find anything here!',
          }],
        });
      } catch (err) {
        console.log(err);
        return res.status(500).json({
          errors: [err],
        });
      }
    });
  }

  findMembers() {
    this.router.get('/organization/:orgId/members', async (req, res) => {
      try {
        const data = await Organization.findOne({
          where: {
            id: req.params.orgId,
            // OrganizationId: null,
          },
          include: [
            {
              model: Member,
              as: 'OrganizationMembers',
              include: [User],
            },
          ],
        });
        if (data) {
          return res.status(200).json({
            data,
            // data: {
            //   type: 'Organization',
            //   id: data.id,
            //   attributes: orgFormat.format(data),
            // },
          });
        }
        return res.status(404).json({
          errors: [{
            message: 'Didn’t find anything here!',
          }],
        });
      } catch (err) {
        console.log(err);
        return res.status(500).json({
          errors: [err],
        });
      }
    });
  }
};
