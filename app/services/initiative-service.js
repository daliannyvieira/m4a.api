const { Op } = require('sequelize');
const {
  Initiative, Interests, InitiativesImages, Matches, User,
} = require('../../domain/entities');
const { uploadImage, findMessages } = require('../../infra/cloud-storage');
const { multer } = require('../../infra/helpers');
const { InitiativeRepository } = require('../../domain/repositories');
const { loggedUser } = require('../../domain/auth');
const shortJson = require('../responses/initiatives-short.js');
const longJson = require('../responses/initiatives-long.js');

module.exports = class Initiatives {
  constructor(router) {
    this.router = router;
  }

  expose() {
    this.createInitiative();
    this.findInitiative();
    this.findInitiativesList();
    this.uploadPhotos();
    this.deleteInitiative();
    this.getMessages();
  }

  getMessages() {
    this.router.get('/initiative/chat/messages', async (req, res) => {
      try {
        const { initiative } = req.query;
        if (initiative) {
          const messages = await findMessages(initiative);
          return res.status(200).json({
            data: {
              messages,
            },
          });
        }
        return res.status(404).json({
          errors: [{
            message: 'Didn’t any messages here!',
          }],
        });
      } catch (err) {
        console.log('err', err)
        return res.status(500).json({
          errors: [err],
        });
      }
    });
  }

  createInitiative() {
    this.router.post('/initiative', async (req, res) => {
      try {
        const initiative = await Initiative.create(req.body);

        if (req.body.interests) {
          await initiative.setInterests(req.body.interests);
          return res.status(201).json({
            data: {
              type: 'Initiative',
              id: initiative.id,
              attributes: longJson.format(initiative),
              relationships: longJson.format(initiative),
            },
          });
        }

        return res.status(201).json({
          data: {
            type: 'Initiative',
            id: initiative.id,
            attributes: longJson.format(initiative),
          },
        });
      } catch (err) {
        const errors = err.errors && err.errors.map((error) => ({
          message: error.message,
          type: error.type,
          field: error.path,
        }));
        return res.status(500).json({
          errors: [
            {
              message: err.name || errors,
            },
          ],
        });
      }
    });
  }

  findInitiative() {
    this.router.get('/initiative/:initiativeId', async (req, res) => {
      try {
        const user = await loggedUser(req);

        const initiative = await Initiative.findOne({
          where: { id: req.params.initiativeId },
          include: [Interests, InitiativesImages, User],
        });

        const matches = await Matches.findAll({
          where: {
            InitiativeId: req.params.initiativeId,
            liked: true,
          },
          include: [
            {
              model: User,
            },
          ],
        });

        if (initiative) {
          const data = initiative;
          data.Matches = user.Initiatives;

          return res.status(200).json({
            data: {
              type: 'Initiative',
              id: data.id,
              attributes: longJson.format(data),
              relationships: {
                interests: data.Interests,
                images: data.InitiativesImages,
                members: matches.map((item) => item.User),
                creator: data.User,
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
        console.log('er', err);
        return res.status(500).json({
          errors: [err],
        });
      }
    });
  }

  findInitiativesList() {
    this.router.get('/initiatives', async (req, res) => {
      try {
        const user = await loggedUser(req);
        if (user) {
          const MatchesList = await Matches.findAll({
            where: { UserId: user.id },
          });
          const IdMatches = MatchesList.map((item) => item.InitiativeId);
          const initiatives = await Initiative.findAll({
            where: {
              UserId: {
                [Op.not]: user.id,
              },
              id: {
                [Op.not]: IdMatches,
              },
            },
            include: [Interests, InitiativesImages],
          });
          if (req.query.nearest) {
            const result = await InitiativeRepository.findNearest(user, IdMatches);
  
            if (result) {
              return res.status(200).json({
                data: result.map((initiative) => shortJson.format(initiative)),
              });
            }
            return res.status(500).json({
              data: 'something is broken',
            });
          }
          return res.status(200).json({
            data: initiatives.map((initiative) => shortJson.format(initiative)),
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

  uploadPhotos() {
    this.router.post('/initiative/photos/:initiativeId', multer.array('image', 5), async (req, res) => {
      try {
        const find = await Initiative.findOne({
          where: { id: req.params.initiativeId },
        });

        if (find) {
          const saveFirebase = await Promise.all(
            req.files.map((item) => uploadImage(item, find.name)),
          );
          if (saveFirebase) {
            const saveMySQL = await Promise.all(
              saveFirebase.map((item) => {
                InitiativesImages.create({
                  InitiativeId: req.params.initiativeId,
                  image: item,
                });
              }),
            );

            if (saveMySQL) {
              return res.status(200).json({
                data: saveFirebase,
              });
            }
          }
        } else {
          return res.status(404).json({
            errors: [{
              message: 'Didn’t find anything here!',
            }],
          });
        }
      } catch (err) {
        return res.status(500).json({
          errors: [err],
        });
      }
    });
  }

  deleteInitiative() {
    this.router.delete('/initiative/:initiativeId', async (req, res) => {
      try {
        if (await Initiative.findOne({ where: { id: req.params.initiativeId } })) {
          if (await Initiative.destroy({ where: { id: req.params.initiativeId } })) {
            return res.status(200).json({
              message: 'Initiative has been deleted.',
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
};
