const {
  User, Initiative, Matches, Interests, InitiativesImages, Organization,
} = require('../../domain/entities');
const { uploadImage, storageBucket } = require('../../infra/cloud-storage');
const { multer } = require('../../infra/helpers');
const { login } = require('../../domain/auth');
const { loggedUser } = require('../../domain/auth');
const usersShortFormat = require('../responses/users-short');
const userFormat = require('../responses/users-long');
const orgFormat = require('../responses/orgs-long');
const initFormat = require('../responses/initiatives-long.js');

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
    this.findOrgsByUser();
    this.findUserChat();
    this.findUserByEmail();
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
        return res.status(200).json({
          data: await User.findAll().map((user) => usersShortFormat.format(user)),
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
        const data = await Organization.findAll({
          where: {
            idAdmin: req.params.userId,
            OrganizationId: null,
          },
        });
        if (data) {
          return res.status(200).json({
            data: data.map(((org) => ({
              type: 'Organization',
              id: org.id,
              attributes: orgFormat.format(org),
            }))),
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
          return res.status(200).json({
            data: {
              initiatives: initiatives && initiatives.map((init) => ({
                type: 'Initiative',
                id: init.id,
                attributes: initFormat.format(init),
              })),
              matches: matches && matches.map((match) => ({
                type: 'Initiative',
                id: match.Initiative.id,
                attributes: initFormat.format(match.Initiative),
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
