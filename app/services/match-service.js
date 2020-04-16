const {
  User, Initiative, Matches,
} = require('../../domain/entities');
const { loggedUser, login } = require('../../domain/auth');

module.exports = class Users {
  constructor(router) {
    this.router = router;
  }

  expose() {
    this.createMatch();
    this.removeMatch();
    this.updateMatch();
  }

  createMatch() {
    this.router.post('/user/:userId/match/:initiativeId', async (req, res) => {
      try {
        const user = await User.findOne({
          where: { id: req.params.userId },
          include: [{
            model: Initiative,
            as: 'UserInitiatives',
          }],
        });
        if (user && req.params.initiativeId) {
          const isOwner = user.UserInitiatives.find((initiative) => initiative.dataValues.id == req.params.initiativeId);
          if (isOwner) {
            return res.status(401).json({
              errors: [{
                message: `Sorry, ${user.username} is the owner of the initiative.`,
              }],
            });
          }
          const match = await Matches.create({
            InitiativeId: req.params.initiativeId,
            UserId: req.params.userId,
            liked: req.body.liked,
          });
          const token = await login(user);
          res.setHeader('Authorization', `Bearer ${token}`);
          return res.status(200).json({
            data: {
              type: 'Match',
              attributes: match,
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

  removeMatch() {
    this.router.delete('/user/:userId/match/:initiativeId', async (req, res) => {
      try {
        const token = await loggedUser(req);
        const user = await User.findOne({
          where: { id: req.params.userId },
          include: [{ model: Initiative, as: 'UserInitiatives' }],
        });
        if (token && user && user.id === token.id) {
          const find = await user.removeInitiative(req.params.initiativeId);
          const newToken = await login(user);
          res.setHeader('Authorization', `Bearer ${newToken}`);
          if (find) {
            return res.status(200).json({
              message: 'Match was removed with success.',
            });
          }
          return res.status(404).json({
            errors: [{
              message: 'Didn’t find anything here!',
            }],
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

  updateMatch() {
    this.router.put('/user/:userId/initiative/:initiativeId', async (req, res) => {
      try {
        const user = await User.findOne({
          where: { id: req.params.userId },
          include: [{ model: Initiative, as: 'UserInitiatives' }],
        });

        if (user && req.params.initiativeId) {
          const isOwner = user.UserInitiatives.find((initiative) => initiative.dataValues.id == req.params.initiativeId);
          if (isOwner) {
            await Initiative.update(
              req.body, {
                where: {
                  id: req.params.initiativeId,
                  UserId: req.params.userId,
                },
              },
            );
            const token = await login(user);
            res.setHeader('Authorization', `Bearer ${token}`);
            return res.status(200).json({
              message: 'Match was updated with success.',
            });
          }
          await Matches.update(
            req.body, {
              where: {
                InitiativeId: req.params.initiativeId,
                UserId: req.params.userId,
              },
            },
          );
          const token = await login(user);
          res.setHeader('Authorization', `Bearer ${token}`);
          return res.status(200).json({
            message: 'Match was updated with success.',
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
