const {
  User, Initiative, Matches, Interests, InitiativesImages,
} = require('../../domain/entities');
const { uploadImage, storageBucket } = require('../../infra/cloud-storage');
const { multer } = require('../../infra/helpers');
const { login } = require('../../domain/auth');
const { loggedUser } = require('../../domain/auth');
const UsersShort = require('../responses/users-short');
const UsersLong = require('../responses/users-long');

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
              attributes: UsersLong.format(user),
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

  findUserAndInitiatives() {
    this.router.get('/user/:id/initiatives', async (req, res) => {
      try {
        const user = await User.findOne({
          where: {
            id: req.params.id,
          },
          include: [
            {
              model: Initiative,
              as: 'UserInitiatives',
              include: [InitiativesImages, Interests],
            },
          ],
        });
        const matches = await Matches.findAll({
          where: {
            UserId: req.params.id,
            liked: true,
          },
          include: [
            {
              model: Initiative,
              include: [InitiativesImages, Interests],
            },
          ],
        });
        if (user) {
          return res.status(200).json({
            data: {
              type: 'User',
              id: user.id,
              attributes: UsersLong.format(user),
              relationships: {
                userInitiatives: user.UserInitiatives,
                matches: matches.map((item) => item.Initiative),
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
          res.status(200).json({
            data: {
              type: 'User',
              id: user.id,
              attributes: UsersLong.format(update.dataValues),
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
        res.status(500).json({
          errors: [err],
        });
      }
    });
  }

  createUser() {
    this.router.post('/user', async (req, res) => {
      try {
        const newUser = await User.create(req.body);
        const token = await login(req.body.email);

        if (req.body.interests) {
          await newUser.setInterests(req.body.interests);
          const user = await User.findOne({
            where: { email: req.body.email },
            include: [Interests],
          });
          res.status(201).json({
            data: {
              type: 'User',
              id: user.id,
              attributes: UsersLong.format(user),
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
        } else {
          res.status(201).json({
            data: {
              type: 'User',
              id: newUser.id,
              attributes: UsersLong.format(newUser),
              token,
            },
          });
        }
      } catch (err) {
        res.status(500).json(err.errors && err.errors.map((error) => ({
          message: error.message,
          type: error.type,
        })));
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
                { avatar: `https://${storageBucket}.storage.googleapis.com/${image}`, },
                { where: { id: user.id } },
              );
              res.status(200).json({
                data: {
                  type: 'User',
                  id: data.id,
                  attributes: UsersLong.format(data),
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
        } else {
          return res.status(404).json({
            errors: [{
              message: 'Didn’t find anything here!',
            }],
          });
        }
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
        res.status(200).json({
          data: await User.findAll().map((user) => UsersShort.format(user)),
        });
      } catch (err) {
        console.log(err);
        res.status(500).json(err.errors && err.errors.map((error) => ({
          message: error.message,
          type: error.type,
        })));
      }
    });
  }
};
