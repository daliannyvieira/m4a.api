const { Op } = require('sequelize');
const {
  Initiative, Interests, InitiativesImages, Matches, User,
} = require('../../domain/entities');
const { uploadImage, deleteImage, storageBucket } = require('../../infra/cloud-storage');
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
    this.updateInitiative();
    this.updateInitiativeInterests();
    this.removePhoto();
    this.uploadPhoto();
  }

  createInitiative() {
    this.router.post('/initiative', async (req, res) => {
      try {
        const user = await loggedUser(req);
        if (user) {
          const { body } = req;
          body.UserId = user.id;
          const initiative = await Initiative.create(body);

          if (req.body.interests) {
            await initiative.setInterests(req.body.interests);
            return res.status(201).json({
              data: {
                type: 'Initiative',
                id: initiative.id,
                attributes: longJson.format(initiative),
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

        const hasItem = matches.find((item) => item.User.id === user.id);

        if (initiative && user) {
          const data = initiative;
          data.Matches = user.Initiatives;

          return res.status(200).json({
            data: {
              type: 'Initiative',
              id: data.id,
              muted_notification: user.id === initiative.UserId
                ? initiative && initiative.muted
                : hasItem && hasItem.muted,
              attributes: longJson.format(data),
              relationships: {
                Interests: data.Interests.map((item) => ({
                  id: item.id,
                  description: item.description,
                  type: item.type,
                })),
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
                data: result.map((initiative) => ({
                  type: 'Initiatives',
                  id: initiative.id,
                  attributes: shortJson.format(initiative),
                  relationships: {
                    interests: initiative.Interests && initiative.Interests.map((interest) => ({
                      id: interest.id,
                      description: interest.description,
                      type: interest.type,
                    })),
                    images: initiative.InitiativesImages && initiative.InitiativesImages.map((img) => ({
                      id: img.id,
                      image: img.image,
                    })),
                  },
                })),
              });
            }
            return res.status(500).json({
              data: 'something is broken',
            });
          }
          return res.status(200).json({
            data: initiatives.map((initiative) => ({
              type: 'Initiatives',
              id: initiative.id,
              attributes: shortJson.format(initiative),
              relationships: {
                interests: initiative.Interests && initiative.Interests.map((interest) => ({
                  id: interest.id,
                  description: interest.description,
                  type: interest.type,
                })),
                images: initiative.InitiativesImages && initiative.InitiativesImages.map((img) => ({
                  id: img.id,
                  image: img.image,
                })),
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
        console.log(err);
        return res.status(500).json({
          errors: [err],
        });
      }
    });
  }

  uploadPhoto() {
    this.router.post('/initiative/:initiativeId/photo', multer.single('image'), async (req, res) => {
      try {
        const initiative = await Initiative.findOne({
          where: { id: req.params.initiativeId },
        });

        if (initiative) {
          const image = await uploadImage(req.file, initiative.name);

          if (image) {
            const persist = await InitiativesImages.create({
              InitiativeId: req.params.initiativeId,
              image: `https://${storageBucket}.storage.googleapis.com/${image}`,
              name: image,
            });

            if (persist) {
              return res.status(200).json({
                data: persist,
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
        console.log('err', err);
        return res.status(500).json({
          errors: [err],
        });
      }
    });
  }

  removePhoto() {
    this.router.delete('/initiative/:initiativeId/photo/:photoId', multer.single('image'), async (req, res) => {
      try {
        const user = await loggedUser(req);
        const initiative = await Initiative.findOne({
          where: { id: req.params.initiativeId },
        });
        if (initiative) {
          if (user.id === initiative.UserId) {
            const image = await InitiativesImages.findOne({
              where: { id: req.params.photoId },
              include: [Initiative],
            });
            if (image) {
              const removed = await deleteImage(image.name);

              if (removed) {
                await InitiativesImages.destroy({
                  where: { id: req.params.photoId },
                });
                return res.status(200).json({
                  message: 'Image has been deleted.',
                });
              }
            }
            return res.status(404).json({
              errors: [{
                message: 'Didn’t find anything here!',
              }],
            });
          }
          return res.status(503).json({
            errors: [{
              message: 'This is not your initiative!',
            }],
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
            const persist = await Promise.all(
              saveFirebase.map((item) => InitiativesImages.create({
                InitiativeId: req.params.initiativeId,
                image: `https://${storageBucket}.storage.googleapis.com/${item}`,
                name: item,
              })),
            );

            if (persist) {
              return res.status(200).json({
                data: persist,
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
        console.log('err', err);
        return res.status(500).json({
          errors: [err],
        });
      }
    });
  }

  deleteInitiative() {
    this.router.delete('/initiative/:initiativeId', async (req, res) => {
      try {
        const user = await loggedUser(req);
        const initiative = await Initiative.findOne({
          where: { id: req.params.initiativeId },
        });
        if (initiative) {
          if (user.id === initiative.UserId) {
            await Initiative.destroy({
              where: { id: req.params.initiativeId },
            });
            return res.status(200).json({
              message: 'Initiative has been deleted.',
            });
          }
          return res.status(403).json({
            errors: [{
              message: 'This is not your initiative!',
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

  updateInitiative() {
    this.router.put('/initiative/:initiativeId', async (req, res) => {
      try {
        const initiative = await Initiative.findOne({
          where: { id: req.params.initiativeId },
        });
        if (initiative) {
          const update = await initiative.update(
            req.body, {
              where: { id: initiative.id },
            },
          );
          return res.status(200).json({
            data: {
              type: 'Initiative',
              id: initiative.id,
              attributes: update.dataValues,
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

  updateInitiativeInterests() {
    this.router.put('/initiative/:initiativeId/interests', async (req, res) => {
      try {
        const initiative = await Initiative.findOne({
          where: { id: req.params.initiativeId },
        });
        if (initiative) {
          await initiative.setInterests(req.body.interests);
          return res.status(201).json({
            message: 'Interests has been updated.',
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
};
