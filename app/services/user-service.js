'use strict';
const { User, Initiative, Interests, InitiativesImages } = require('../../domain/entities');
const { uploadImage, multer } = require('../../domain/firebaseStorage');
const { login } = require('../../domain/auth');
const UsersShort = require('../responses/users-short');
const UsersLong = require('../responses/users-long');
const UserRelationships = require('../responses/users-relationships');

module.exports = class Users {
  constructor(router) {
    this.router = router;
  }

  expose() {
    this.findUsersList();
    this.createUser();
    this.findUser();
    this.updateUser();
    this.deleteUser();
    this.uploadAvatar();
    this.updateUserInterests();
    this.createMatch();
    this.removeMatch();
  }

  findUsersList() {
    this.router.get('/users', async (req, res) => {
      try {
        res.status(200).json({
          data: await User.findAll().map((user) => UsersShort.format(user))
        })
      }
      catch (err) {
        const error = { message: err.message }
        const errors = err.errors && err.errors.map(err => ({
          message: err.message,
          type: err.type,
          field: err.path
        }))
        res.status(500).json(errors || error)
      }
    });
  }

  createUser() {
    this.router.post('/users', async (req, res) => {
      try {
        const user = await User.create(req.body)
        const token = await login(req.body.email)
        const data = UsersLong.format(user)
        data.token = token;

        if (req.body.interests) {
          const interests = await user.setInterests(req.body.interests);
          res.status(200).json({
            data: data,
            relationships: {
              interests
            }
          })
        }
        else {
          res.status(200).json({
            data: data
          })
        }
      }
      catch (err) {
        const error = { message: err.message }
        const errors = err.errors && err.errors.map(err => ({
          message: err.message,
          type: err.type,
          field: err.path
        }))
        res.status(500).json(errors || error)
      }
    });
  }

  findUser() {
    this.router.get('/users/:id', async (req, res) => {
      try {
        const { include } = req.query;
        
        if (include === 'initiatives') {
          const user = await User.findOne({
            where: { id: req.params.id },
            include: [
              {
                'model': Initiative, as: 'UserInitiatives',
                include: [InitiativesImages]
              },
              {
                'model': Initiative,
                include: [InitiativesImages]
              }
            ]
          })

          if (user) {
            return res.status(200).json({
              data: UserRelationships.format(user)
            });
          }
        }

        const user = await User.findOne({
          where: { id: req.params.id },
          include: [Interests]
        })

        if (user) {
          return res.status(200).json({
            data: UserRelationships.format(user)
          });
        }

        return res.status(404).json({
          message: 'Didn’t find anything here!'
        });
      }
      catch (err) {
        console.log(err)
        res.status(500).json({ message: 'something is broken' })
      }
    });
  }

  updateUser() {
    this.router.put('/users/:userId', async (req, res) => {
      try {
        const user = await User.findOne({
          where: { id: req.params.userId }
        })
        if (user) {
          const update = await user.update(
            req.body, {
            where: { id: req.params.userId }
          })

          return res.status(201).json({
            message: 'User has been updated.',
            data: update.dataValues
          });
        }
        return res.status(404).json({
          message: 'User not found.'
        });
      }
      catch (err) {
        return res.status(500).json(err);
      }
    });
  }

  updateUserInterests() {
    this.router.put('/users/:userId/interests', async (req, res) => {
      try {
        const user = await User.findOne({
          where: { id: req.params.userId }
        });
        if (user){
          if (req.body.interests) {
            await user.setInterests(req.body.interests);

            return res.status(201).json({
              message: 'Interests has been updated.'
            });
          }
          else {
            return res.status(405).json({
              message: 'Interests was not declared.'
            });
          }
        }
        return res.status(404).json({
          message: 'User not found.'
        });
      }
      catch (err) {
        return res.status(500).json(err);
      }
    });
  }


  deleteUser() {
    this.router.delete('/users/:userId', async (req, res) => {
      try {
        if (await User.findOne({ where: { id: req.params.userId } })) {
          if (await User.destroy({ where: { id: req.params.userId } })) {
            return res.status(201).json({
              message: 'User has been deleted.'
            });
          }
        }
        return res.status(404).json({
          message: 'Didn’t find anything here!'
        });
      }
      catch (err){
        res.status(500).json({ message: 'something is broken' });
      }
    });
  }

  uploadAvatar() {
    this.router.post('/users/uploadavatar/:userId', multer.single('image'), async (req, res) => {
      try {
        const user = await User.findOne({
          where: { id: req.params.userId }
        })

        if (user) {
          let username = user.username
          let file = req.file

          if (file) {
            const firebase = await uploadImage(file, username)

            if (firebase) {
              const avatar = await user.update(
                { avatar: firebase }, { where: { id: req.params.userId }
              })
              res.status(200).json({ data: UsersLong.format(avatar) })
            }
          }
          else {
            res.status(404).json({ message: 'file not found' })
          }
        }
        else {
          res.status(404).json({ message: 'user not found' })
        }
      }
      catch (err) {
        console.log(err)
      }
    });
  }

  createMatch() {
    this.router.post('/users/:userId/match/:initiativeId', async (req, res) => {
      try {
        const user = await User.findOne({
          where: { id: req.params.userId },
          include: [{'model': Initiative, as: 'UserInitiatives'}]
        })
        if (user && req.params.initiativeId) {
          const isOwner = user.UserInitiatives.find((initiative) => {
            return initiative.dataValues.id == req.params.initiativeId
          })
          if (isOwner) {
            return res.status(404).json({
              message: "Sorry, user is initiative's owner."
            });
          }
          else {
            await user.addInitiative(req.params.initiativeId);

            return res.status(201).json({
              message: 'Match was created with success.'
            });
          }
        }
        return res.status(404).json({
          message: 'User not found.'
        });
      }     
      catch (err) {
        console.log(err)
        res.status(500).json(err)
      }
    });
  }

  removeMatch() {
    this.router.delete('/users/:userId/match/:initiativeId', async (req, res) => {
      try {
        const user = await User.findOne({
          where: { id: req.params.userId },
          include: [{'model': Initiative, as: 'UserInitiatives'}]
        })
        if (user) {
          const find = await user.removeInitiative(req.params.initiativeId)
          if (find === 1) {
            return res.status(200).json({
              message: 'Match was removed with success.'
            });
          }
          else {
            return res.status(404).json({
              message: 'Match was not found.'
            });
          }
        }
        else {
          return res.status(404).json({
            message: 'User not found.'
          });
        }
      }
      catch (err) {
        console.log(err)
        res.status(500).json(err)
      }
    });
  }

};