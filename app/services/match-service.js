const {
  User, Initiative,
} = require('../../domain/entities');
const { loggedUser } = require('../../domain/auth');

module.exports = class Users {
  constructor(router) {
    this.router = router;
  }

  expose() {
    this.createMatch();
    this.removeMatch();
  }

  createMatch() {
    this.router.post('/users/:userId/match/:initiativeId', async (req, res) => {
      try {
        const user = await User.findOne({
          where: { id: req.params.userId },
          include: [{ model: Initiative, as: 'UserInitiatives' }],
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
          const match = await user.addInitiative(req.params.initiativeId);

          return res.status(200).json({
            data: {
              type: 'Match',
              attributes: match.map((ids) => ({
                initiativeId: ids.InitiativeId,
                userId: ids.UserId,
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

  removeMatch() {
    this.router.delete('/users/:userId/match/:initiativeId', async (req, res) => {
      try {
        const token = await loggedUser(req);
        const user = await User.findOne({
          where: { id: req.params.userId },
          include: [{ model: Initiative, as: 'UserInitiatives' }],
        });
        if (token && user && user.id === token.id) {
          const find = await user.removeInitiative(req.params.initiativeId);
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
};
