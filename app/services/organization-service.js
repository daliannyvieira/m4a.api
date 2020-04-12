const { Op } = require('sequelize');
const {
  Organization, Initiative, InitiativesImages, Interests, Matches, Member, User, Orm, sequelize,
} = require('../../domain/entities');

const { loggedUser, handleDecode } = require('../../domain/auth');
const {
  uploadImage, storageBucket, deleteImage,
} = require('../../infra/cloud-storage');
const { multer } = require('../../infra/helpers');
const { generateReport } = require('../../infra/reports');
const orgFormat = require('../responses/orgs-long');
const userFormat = require('../responses/users-long');
const usersShort = require('../responses/users-short');
const initFormat = require('../responses/initiatives-long.js');
const initShortFormat = require('../responses/initiatives-short.js');

module.exports = class Initiatives {
  constructor(router) {
    this.router = router;
  }

  expose() {
    this.createOrganization();
    this.findOrganization();
    this.findOrgInitiatives();
    this.uploadImageOrg();
    this.createOrgMember();
    this.findOrgMembers();
    this.createCommitees();
    this.findCommittees();
    this.findCommittee();
    this.createCommitteeMember();
    this.findCommitteeMembers();
    this.findCommitteeInitiatives();
    this.uploadImageCommittee();
    this.findOrgInitiativesReport();
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
              include: [{
                model: Member,
                as: 'OrganizationMembers',
                required: false,
                include: ['User'],
              },
              {
                model: Initiative,
                as: 'OrganizationInitiatives',
                required: false,
                include: [InitiativesImages, Interests],
              }],
            },
          ],
        });
        if (data) {
          return res.status(200).json({
            data: data.Committee.map(((comm) => ({
              type: 'Committees',
              id: comm.id,
              attributes: orgFormat.format(comm),
              relationships: {
                volunteers: comm.OrganizationMembers && comm.OrganizationMembers.map(((user) => ({
                  type: user.User && 'User',
                  id: user.User && user.User.id,
                  attributes: user.User && usersShort.format(user.User),
                }))),
                initiatives: comm.OrganizationInitiatives && comm.OrganizationInitiatives.map((init) => ({
                  type: 'Initiative',
                  id: init.id,
                  attributes: initShortFormat.format(init, comm.name),
                })),
              },
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
    this.router.get('/organization/:orgId', async (req, res) => {
      try {
        const organization = await Organization.findOne({
          where: {
            id: req.params.orgId,
            OrganizationId: null,
          },
        });
        if (organization) {
          const select = `
            SELECT * FROM Interests i2 
            WHERE i2.id IN(
              SELECT ii.InterestId FROM InitiativesInterests ii
              WHERE ii.InitiativeId IN (
                SELECT i.id FROM Initiatives i 
                WHERE i.OrganizationId IN (
                  SELECT o.id FROM Organizations o
                  WHERE o.OrganizationId = ${organization.id}
                )
              )
            )`;

          const intsChildrens = await sequelize.query(select, { type: Orm.QueryTypes.SELECT });

          return res.status(200).json({
            data: {
              type: 'Organization',
              id: organization.id,
              attributes: orgFormat.format(organization),
              relationships: {
                interests: intsChildrens.map((interest) => ({
                  id: interest.id,
                  description: interest.description,
                  type: interest.type,
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

  findCommittee() {
    this.router.get('/committee/:committeeId', async (req, res) => {
      try {
        const committee = await Organization.findOne({
          where: {
            id: req.params.committeeId,
            OrganizationId: {
              [Op.not]: null,
            },
          },
        });
        if (committee) {
          const select = `
            SELECT * FROM Interests i2 
            WHERE i2.id IN(
              SELECT ii.InterestId FROM InitiativesInterests ii
              WHERE ii.InitiativeId IN (
                SELECT i.id FROM Initiatives i 
                WHERE i.OrganizationId = ${committee.id}
              )
            )`;

          const intsChildrens = await sequelize.query(select, { type: Orm.QueryTypes.SELECT });

          return res.status(200).json({
            data: {
              type: 'Committee',
              id: committee.id,
              attributes: orgFormat.format(committee),
              relationships: {
                interests: intsChildrens.map((interest) => ({
                  id: interest.id,
                  description: interest.description,
                  type: interest.type,
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
                type: 'Committee',
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

  findOrgInitiativesReport() {
    this.router.get('/organization/initiatives/report', async (req, res) => {
      try {
        if (req.query.initiatives) {
          const array = JSON.parse(`[${req.query.initiatives}]`);
          const initiatives = await Initiative.findAll({
            where: {
              id: array,
            },
            // include: ['Organization', 'Interests', 'User', 'initMatches'],
            include: ['Interests', 'initMatches'],
          });
          const headers = [
            'Nome',
            'Website',
            'Bio',
            'País',
            'Cidade',
            'Endereço',
            'Data de inicio da ação',
            'Data de fim da ação',
            'Organização beneficiaria',
            'Número de beneficiarios',
            'Parceiros',
            'Expectativa de voluntários',
            'Expectativa em arrecadação',
            'Interesses',
            'ODS',
            'Quantidade de voluntários',
            'Nomes dos voluntários',
            'Data de criação',
            // 'Proponente',
          ];

          const data = [];
          initiatives.map((item) => {
            const interests = item.Interests.filter((int) => int.type !== 'SDGs').map((i) => i.description);
            const ods = item.Interests.filter((int) => int.type === 'SDGs').map((i) => i.description);
            const likes = item.initMatches.filter((match) => match.Matches.liked === true)

            const init = {
              name: item.name,
              website: item.website,
              bio: item.bio,
              country: item.country,
              city: item.city,
              address: item.address,
              start: item.start,
              finish: item.finish,
              orgBeneficiary: item.orgBeneficiary,
              beneficiaries: item.beneficiaries,
              partners: item.partners,
              volunteersExpectation: item.volunteersExpectation,
              amountExpectation: item.amountExpectation,
              interesses: interests.join(', '),
              ODS: ods.join(', '),
              likesQtd: likes.length,
              likesName: likes.map((user) => user.username),
              createdAt: item.createdAt,
            };
            // if (item.Organization) {
            //   init.ownerName = item.Organization.name;
            // }
            // if (item.User && !item.Organization) {
            //   init.ownerName = item.User.username;
            // }
            data.push(init);
          });

          const body = data.map((item) => Object.values(item));

          const report = await generateReport([headers, ...body]);

          res.attachment(`initiatives_${Date.now()}.xlsx`);
          return res.status(200).send(report);
          // return res.status(200).json({
          //   data,
          // });
        }
        return res.status(404).json({
          errors: [{
            message: 'Didn’t find anything here!',
            req: req.query,
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
        if (req.query.include_committees) {
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
              {
                model: Organization,
                as: 'Committee',
                include: [
                  {
                    model: Initiative,
                    as: 'OrganizationInitiatives',
                    include: [InitiativesImages, Interests],
                  },
                ],
              },
            ],
          });
          if (organization) {
            const initiatives = [];
            organization.OrganizationInitiatives.map((init) => {
              initiatives.push({
                type: 'Initiative',
                id: init.id,
                attributes: initFormat.format(init, organization.name),
              });
            });
            organization.Committee.map((item) => item.OrganizationInitiatives.map((ini) => {
              initiatives.push({
                type: 'Initiative',
                id: ini.id,
                attributes: initFormat.format(ini, organization.name),
              });
            }));
            return res.status(200).json({
              data: {
                type: 'Organization',
                id: organization.id,
                attributes: orgFormat.format(organization),
                relationships: {
                  initiatives,
                },
              },
            });
          }
          return res.status(404).json({
            errors: [{
              message: 'Didn’t find anything here!',
            }],
          });
        }
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
                  attributes: initFormat.format(init, organization.name),
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

  createOrgMember() {
    this.router.post('/organization/:orgId/members', async (req, res) => {
      const t = await sequelize.transaction();
      try {
        const { members } = req.body;
        const user = await handleDecode(req);
        if (!user) {
          throw new Error('USER_NOT_FOUND');
        }
        if (!members) {
          throw new Error('BODY_INVALID');
        }
        const hasOwner = members.find((item) => item === user.info.id);
        if (hasOwner) {
          throw new Error('IS_OWNER');
        }
        const select = `SELECT UserId FROM Members WHERE OrganizationId = ${req.params.orgId} AND UserId IN (${members.join(',')})`;

        let existingMembers = await sequelize.query(select, { type: Orm.QueryTypes.SELECT });
        existingMembers = existingMembers.map((item) => item.UserId);

        const filtered = members.filter((item) => !existingMembers.includes(item));

        if (filtered.length > 0) {
          const mappedMembers = filtered.map((item) => `(${req.params.orgId}, ${item})`);
          const query = `INSERT INTO Members (OrganizationId, UserId) VALUES ${mappedMembers.join(', ')}`;
          const [results, metadata] = await sequelize.query(query, { transaction: t });
          await t.commit();
          return res.status(201).json({
            message: 'Members added with success.',
          });
        }
        throw new Error('ALREADY_A_MEMBER');
      } catch (err) {
        console.log(err);
        await t.rollback();
        if (err.message === 'USER_NOT_FOUND') {
          return res.status(404).json({
            errors: [{
              message: 'Didn’t find anything here!',
            }],
          });
        }
        if (err.message === 'BODY_INVALID') {
          return res.status(400).json({
            errors: [{
              message: 'You must include array members',
            }],
          });
        }
        if (err.message === 'IS_OWNER') {
          return res.status(400).json({
            errors: [{
              message: 'You are already a member',
            }],
          });
        }
        if (err.message === 'ALREADY_A_MEMBER') {
          return res.status(400).json({
            errors: [{
              message: 'You are already a member',
            }],
          });
        }
        return res.status(500).json({
          errors: [err],
        });
      }
    });
  }

  createCommitteeMember() {
    this.router.post('/committee/:orgId/members', async (req, res) => {
      const t = await sequelize.transaction();
      try {
        const { members } = req.body;
        const user = await handleDecode(req);
        if (!user) {
          throw new Error('USER_NOT_FOUND');
        }
        if (!members) {
          throw new Error('BODY_INVALID');
        }
        const hasOwner = members.find((item) => item === user.info.id);
        if (hasOwner) {
          throw new Error('IS_OWNER');
        }
        const select = `SELECT UserId FROM Members WHERE OrganizationId = ${req.params.orgId} AND UserId IN (${members.join(',')})`;

        let existingMembers = await sequelize.query(select, { type: Orm.QueryTypes.SELECT });
        existingMembers = existingMembers.map((item) => item.UserId);

        const filtered = members.filter((item) => !existingMembers.includes(item));

        if (filtered.length > 0) {
          const mappedMembers = filtered.map((item) => `(${req.params.orgId}, ${item})`);
          const query = `INSERT INTO Members (OrganizationId, UserId) VALUES ${mappedMembers.join(', ')}`;
          const [results, metadata] = await sequelize.query(query, { transaction: t });
          await t.commit();
          return res.status(201).json({
            message: 'Members added with success.',
          });
        }
        throw new Error('ALREADY_A_MEMBER');
      } catch (err) {
        console.log(err);
        await t.rollback();
        if (err.message === 'USER_NOT_FOUND') {
          return res.status(404).json({
            errors: [{
              message: 'Didn’t find anything here!',
            }],
          });
        }
        if (err.message === 'BODY_INVALID') {
          return res.status(400).json({
            errors: [{
              message: 'You must include array members',
            }],
          });
        }
        if (err.message === 'IS_OWNER') {
          return res.status(400).json({
            errors: [{
              message: 'You are already a member',
            }],
          });
        }
        if (err.message === 'ALREADY_A_MEMBER') {
          return res.status(400).json({
            errors: [{
              message: 'You are already a member',
            }],
          });
        }
        return res.status(500).json({
          errors: [err],
        });
      }
    });
  }

  findOrgMembers() {
    this.router.get('/organization/:orgId/members', async (req, res) => {
      try {
        const data = await Organization.findOne({
          where: {
            id: req.params.orgId,
            OrganizationId: null,
          },
          include: [
            {
              model: Member,
              as: 'OrganizationMembers',
              include: [User],
            },
            User,
          ],
        });
        if (data) {
          return res.status(200).json({
            data: {
              type: 'Organization',
              id: data.id,
              attributes: orgFormat.format(data),
              owner: data.User && ({
                type: data.User && 'User',
                id: data.User && data.User.id,
                attributes: data.User && userFormat.format(data.User),
              }),
              members: data.OrganizationMembers && data.OrganizationMembers.map(((user) => ({
                type: user.User && 'User',
                id: user.User && user.User.id,
                attributes: user.User && userFormat.format(user.User),
              }))),
            },
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

  findCommitteeMembers() {
    this.router.get('/committee/:id/members', async (req, res) => {
      try {
        const data = await Organization.findOne({
          where: {
            id: req.params.id,
            OrganizationId: {
              [Op.not]: null,
            },
          },
          include: [
            {
              model: Member,
              as: 'OrganizationMembers',
              include: [User],
            },
            User,
          ],
        });
        if (data) {
          return res.status(200).json({
            data: {
              type: 'Organization',
              id: data.id,
              attributes: orgFormat.format(data),
              owner: data.User && ({
                type: data.User && 'User',
                id: data.User && data.User.id,
                attributes: data.User && userFormat.format(data.User),
              }),
              members: data.OrganizationMembers && data.OrganizationMembers.map(((user) => ({
                type: user.User && 'User',
                id: user.User && user.User.id,
                attributes: user.User && userFormat.format(user.User),
              }))),
            },
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
