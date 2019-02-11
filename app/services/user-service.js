'use strict';
const { User, Initiative, Interests } = require('../../domain/entities');
const { sendAvatar, handleImage } = require('../../domain/firebaseStorage');
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
    this.matchInitiative();
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

        if (req.body.interests) {
          const interests = await user.setInterests(req.body.interests);
          res.status(200).json({
            data: UsersLong.format(user),
            relationships: {
              interests
            },
            token: token
          })
        }
        else {
          res.status(200).json({
            data: UsersLong.format(user),
            token: token
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
            include: [Interests, {'model': Initiative, as: 'UserInitiatives'}, Initiative]
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
            message: 'User has been updated.'
          });
        }
        return res.status(404).json({
          message: 'User not found.'
        });
      }
      catch (err) {
        console.log(err)
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
          await user.setInterests(req.body.interests);
          
          return res.status(201).json({
            message: 'Interests has been updated.'
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
    this.router.post("/users/uploadavatar", handleImage.single('avatar'), async (req, res) => {
      try {
        const file = await sendAvatar(req.file)
        if (file) res.status(200).json({ message: file })
      }
      catch (err) {
        res.status(500).json({ message: 'something is broken' })
      }
    });
  }

  matchInitiative() {
    this.router.post('/users/:userId/match', async (req, res) => {
      try {
        const user = await User.findOne({
          where: { id: req.params.userId },
          include: [{'model': Initiative, as: 'UserInitiatives'}]
        })
        if (user && req.body.initiativeId) {
          const isOwner = user.UserInitiatives.find((initiative) => {
            return initiative.dataValues.id == req.body.initiativeId
          })
          if (isOwner) {
            return res.status(404).json({
              message: "Sorry, user is initiative's owner."
            });
          }
          else {
            await user.addInitiative(req.body.initiativeId);

            return res.status(201).json({
              message: 'success.'
            });
          }
        }
        return res.status(404).json({
          message: 'User not found.'
        });
      }     
      catch (err) {
        res.status(500).json(err)
      }
    });
  }

};