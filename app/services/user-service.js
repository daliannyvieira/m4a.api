/* eslint-disable max-len */
const { Op } = require('sequelize');
const {
  User, Initiative, Matches, Interests, InitiativesImages, Organization, Member, Orm, sequelize,
} = require('../../domain/entities');
const { uploadImage, storageBucket } = require('../../infra/cloud-storage');
const { multer } = require('../../infra/helpers');
const { login } = require('../../domain/auth');
const { loggedUser } = require('../../domain/auth');
const usersShort = require('../responses/users-short');
const userFormat = require('../responses/users-long');
const orgFormat = require('../responses/orgs-long');
const initFormat = require('../responses/initiatives-long.js');
const initShort = require('../responses/initiatives-short.js');

module.exports = class Users {
  constructor(router) {
    this.router = router;
  }

  expose() {
    this.findUser();
    this.findUserAndInitiatives();
    this.createUser();
    this.uploadAvatar();
    this.updateUser();
    this.updateUserInterests();
    this.removeUser();
    this.findUsersList();
    this.findUserChat();
    this.findUserByEmail();
    this.findOrgsByUser();
    this.findCommitteesByUser();
  }

  findUser() {
    this.router.get('/user/:id', async (req, res) => {
      try {
        const user = await User.findOne({
          where: { id: req.params.id },
          include: [Interests],
        });

        if (user) {
          return res.status(200).json({
            data: {
              type: 'User',
              id: user.id,
              attributes: userFormat.format(user),
              relationships: {
                interests: user.Interests,
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
        console.log(err);
        return res.status(500).json({
          errors: [err],
        });
      }
    });
  }

  findUserByEmail() {
    this.router.get('/user', async (req, res) => {
      try {
        const user = await User.findOne({
          where: { email: req.query.email },
        });
        if (user) {
          return res.status(200).json({
            data: {
              type: 'User',
              id: user.id,
              attributes: {
                name: user.username,
                avatar: user.avatar,
                email: user.email,
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
        console.log(err);
        return res.status(500).json({
          errors: [err],
        });
      }
    });
  }

  findUserAndInitiatives() {
    this.router.get('/user/:id/initiatives', async (req, res) => {
      try {
        const user = await User.findOne({
          where: {
            id: req.params.id,
          },
        });
        const initiatives = await Initiative.findAll({
          where: {
            UserId: req.params.id,
            OrganizationId: null,
            deletedAt: null,
          },
          include: [InitiativesImages, Interests],
        });
        const matches = await Matches.findAll({
          where: {
            UserId: req.params.id,
            liked: true,
          },
          include: [
            {
              model: Initiative,
              where: {
                deletedAt: null,
              },
              include: [InitiativesImages, Interests],
            },
          ],
        });
        if (user) {
          return res.status(200).json({
            data: {
              type: 'User',
              id: user.id,
              attributes: userFormat.format(user),
              relationships: {
                initiatives: initiatives && initiatives.map((init) => ({
                  type: 'Initiative',
                  id: init.id,
                  attributes: initFormat.format(init),
                })),
                matches: matches && matches.map((item) => ({
                  type: 'Initiative',
                  id: item.id,
                  attributes: initFormat.format(item.Initiative),
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
        console.log(err);
        return res.status(500).json({
          errors: [err],
        });
      }
    });
  }

  updateUserInterests() {
    this.router.put('/user/interests', async (req, res) => {
      try {
        const user = await loggedUser(req);
        if (user) {
          await user.setInterests(req.body.interests);
          return res.status(201).json({
            message: 'Interests has been updated.',
          });
        }
        return res.status(404).json({
          message: 'User not found.',
        });
      } catch (err) {
        return res.status(500).json({
          errors: [err],
        });
      }
    });
  }

  updateUser() {
    this.router.put('/user', async (req, res) => {
      try {
        const user = await loggedUser(req);
        if (user) {
          const update = await user.update(
            req.body, {
              where: { id: user.id },
            },
          );
          const token = await login(user.email);
          res.setHeader('Authorization', `Bearer ${token}`);
          return res.status(200).json({
            data: {
              type: 'User',
              id: user.id,
              attributes: userFormat.format(update.dataValues),
              token,
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

  createUser() {
    this.router.post('/user', async (req, res) => {
      try {
        const newUser = await User.create(req.body);

        const token = await login(req.body.email || req.body.facebookId);

        if (req.body.interests) {
          await newUser.setInterests(req.body.interests);

          let user = null;
          if (req.body.email) {
            user = await User.findOne({
              where: { email: req.body.email },
              include: [Interests],
            });
          }

          if (req.body.facebookId) {
            user = await User.findOne({
              where: { facebookId: req.body.facebookId },
              include: [Interests],
            });
          }

          res.setHeader('Authorization', `Bearer ${token}`);
          return res.status(201).json({
            data: {
              type: 'User',
              id: user.id,
              attributes: userFormat.format(user),
              relationships: {
                interests: user.Interests && user.Interests.map((interest) => ({
                  id: interest.id,
                  description: interest.description,
                  type: interest.type,
                })),
              },
              token,
            },
          });
        }
        return res.status(201).json({
          data: {
            type: 'User',
            id: newUser.id,
            attributes: userFormat.format(newUser),
            token,
          },
        });
      } catch (err) {
        console.log(err);
        return res.status(500).json({
          errors: [err],
        });
      }
    });
  }

  uploadAvatar() {
    this.router.post('/user/avatar', multer.single('image'), async (req, res) => {
      try {
        const user = await loggedUser(req);

        if (user) {
          const { username } = user;
          const { file } = req;

          if (file) {
            const image = await uploadImage(file, username);
            if (image) {
              const data = await user.update(
                { avatar: `https://${storageBucket}.storage.googleapis.com/${image}` },
                { where: { id: user.id } },
              );
              res.status(200).json({
                data: {
                  type: 'User',
                  id: data.id,
                  attributes: userFormat.format(data),
                },
              });
            }
          } else {
            res.status(404).json({
              errors: [{
                message: 'file not found',
              }],
            });
          }
        } else {
          res.status(404).json({
            errors: [{
              message: 'user not found',
            }],
          });
        }
      } catch (err) {
        console.log(err);
        res.status(500).json({
          errors: [err],
        });
      }
    });
  }

  removeUser() {
    this.router.delete('/user', async (req, res) => {
      try {
        const user = await loggedUser(req);

        if (user) {
          if (await User.destroy({ where: { id: user.id } })) {
            return res.status(201).json({
              message: 'User has been deleted.',
            });
          }
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

  findUsersList() {
    this.router.get('/users', async (req, res) => {
      try {
        const users = await User.findAll();
        if (users) {
          return res.status(200).json({
            data: users.map(((user) => ({
              type: 'Users',
              id: user.id,
              attributes: usersShort.format(user),
            }))),
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

  findOrgsByUser() {
    this.router.get('/user/:userId/organizations', async (req, res) => {
      try {
        const myOrganizations = await Organization.findAll({
          where: {
            idAdmin: req.params.userId,
            OrganizationId: null,
          },
          include: [{
            model: Organization,
            as: 'Committee',
            attributes: ['id'],
            required: false,
          },
          {
            model: Member,
            as: 'OrganizationMembers',
            attributes: ['UserId'],
            required: false,
          }],
        });
        const workingFor = await Member.findAll({
          where: {
            UserId: req.params.userId,
          },
          include: [{
            model: Organization,
            where: {
              OrganizationId: null,
            },
            include: [
              {
                model: Organization,
                as: 'Committee',
                attributes: ['id'],
                required: false,
              },
              {
                model: Member,
                as: 'OrganizationMembers',
                attributes: ['UserId'],
                required: false,
              }],
          }],
        });
        if (myOrganizations) {
          const selectIntMembers = `
            SELECT * FROM Interests i 
            INNER JOIN (
              SELECT ii.InitiativeId, ii.InterestId, b.OrganizationId FROM InitiativesInterests ii 
              INNER JOIN (
              SELECT * FROM Initiatives i2 WHERE i2.OrganizationId IN (
                SELECT o.OrganizationId FROM Members o 
                WHERE o.UserId = ${req.params.userId}
              )
              ) b
              ON ii.InitiativeId = b.id
            ) a
            ON a.InterestId = i.id
          `;

          const selectIntAdmin = `
            SELECT * FROM Interests i 
            INNER JOIN (
              SELECT ii.InitiativeId, ii.InterestId, b.OrganizationId FROM InitiativesInterests ii 
              INNER JOIN (
                SELECT * FROM Initiatives i2 WHERE i2.OrganizationId IN (
                  SELECT o.id FROM Organizations o 
                  WHERE o.idAdmin = ${req.params.userId}
                )
              ) b
              ON ii.InitiativeId = b.id
            ) a
            ON a.InterestId = i.id
          `;

          const intMembers = await sequelize.query(selectIntMembers, { type: Orm.QueryTypes.SELECT });
          const intAdmin = await sequelize.query(selectIntAdmin, { type: Orm.QueryTypes.SELECT });

          const uniqueIntAdmin = intAdmin.filter((v, i, a) => a.findIndex((t) => (t.id === v.id)) === i);
          const uniqueIntMembers = intMembers.filter((v, i, a) => a.findIndex((t) => (t.id === v.id)) === i);

          return res.status(200).json({
            data: {
              myOrganizations: myOrganizations.map(((org) => ({
                type: 'Organization',
                id: org.id,
                attributes: orgFormat.format(org),
                relationships: {
                  interests: uniqueIntAdmin.filter((int) => int.OrganizationId === org.id).map((interest) => ({
                    id: interest.id,
                    description: interest.description,
                    type: interest.type,
                  })),
                  volunteers: org.OrganizationMembers,
                  committees: org.Committee,
                },
              }))),
              workingFor: workingFor && workingFor.map(((org) => ({
                type: 'Organization',
                id: org.Organization.id,
                attributes: orgFormat.format(org.Organization),
                relationships: {
                  interests: uniqueIntMembers.filter((int) => int.OrganizationId === org.Organization.id).map((interest) => ({
                    id: interest.id,
                    description: interest.description,
                    type: interest.type,
                  })),
                  volunteers: org.Organization.OrganizationMembers,
                  committees: org.Organization.Committee,
                },
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
        console.log('err', err);
        return res.status(500).json({
          errors: [err],
        });
      }
    });
  }

  findCommitteesByUser() {
    this.router.get('/user/:userId/committees', async (req, res) => {
      try {
        const workingFor = await Member.findAll({
          where: {
            UserId: req.params.userId,
          },
          include: [{
            model: Organization,
            where: {
              OrganizationId: {
                [Op.not]: null,
              },
            },
            include: [{
              model: Member,
              as: 'OrganizationMembers',
              attributes: ['UserId'],
              required: false,
            },
            {
              model: Initiative,
              as: 'OrganizationInitiatives',
              attributes: ['id'],
              required: false,
            }],
          }],
        });
        const select = `
          SELECT * FROM Interests i 
          INNER JOIN (
            SELECT ii.InitiativeId, ii.InterestId, b.OrganizationId FROM InitiativesInterests ii 
            INNER JOIN (
            SELECT * FROM Initiatives i2 WHERE i2.OrganizationId IN (
              SELECT o.OrganizationId FROM Members o 
              WHERE o.UserId = ${req.params.userId}
            )
            ) b
            ON ii.InitiativeId = b.id
          ) a
          ON a.InterestId = i.id
        `;

        // const interestsList = await sequelize.query(select, { type: Orm.QueryTypes.SELECT });

        // const unique = interestsList.filter((v, i, a) => a.findIndex((t) => (t.id === v.id)) === i);

        if (workingFor && Object.keys(workingFor).length > 0) {
          return res.status(200).json({
            data: workingFor.map((org) => ({
              type: 'Committee',
              id: org.Organization.id,
              attributes: orgFormat.format(org.Organization),
              relationships: {
                volunteers: org.Organization.OrganizationMembers,
                initiatives: org.Organization.OrganizationInitiatives,
                // unique: unique.filter((int) => int.OrganizationId === org.Organization.id).map((interest) => ({
                //   id: interest.id,
                //   description: interest.description,
                //   type: interest.type,
                //   org: interest.OrganizationId
                // })),
              },
            })),
          });
        }
        return res.status(404).json({
          errors: [{
            message: 'Didn’t find anything here!',
          }],
        });
      } catch (err) {
        console.log('errrr', err);
        return res.status(500).json({
          errors: [err],
        });
      }
    });
  }

  findUserChat() {
    this.router.get('/user/:id/chats', async (req, res) => {
      try {
        const user = await User.findOne({
          where: {
            id: req.params.id,
          },
        });
        const initiatives = await Initiative.findAll({
          where: {
            UserId: req.params.id,
            deletedAt: null,
          },
          include: [InitiativesImages, Interests, Organization, User],
        });
        const matches = await Matches.findAll({
          where: {
            UserId: req.params.id,
            liked: true,
          },
          include: [
            {
              model: Initiative,
              where: {
                deletedAt: null,
              },
              include: [InitiativesImages, Interests, Organization, User],
            },
          ],
        });
        if (user) {
          const chooseOwner = (match) => {
            if (match.Organization) {
              return match.Organization.name;
            }
            if (match.User) {
              return match.name;
            }
            if (match.Initiative.Organization) {
              return match.Initiative.Organization.name;
            }
            if (match.Initiative.User) {
              return match.Initiative.User.username;
            }
            if (match.Initiative.Organization) {
              return match.Initiative.Organization.name;
            }
            return null;
          };
          return res.status(200).json({
            data: {
              initiatives: initiatives && initiatives.map((init) => ({
                type: 'Initiative',
                id: init.id,
                attributes: initFormat.format(init, chooseOwner(init)),
              })),
              matches: matches && matches.map((match) => ({
                type: 'Initiative',
                id: match.Initiative.id,
                attributes: initFormat.format(match.Initiative, chooseOwner(match)),
              })),
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
