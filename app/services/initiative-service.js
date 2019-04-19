'use strict';
const { Initiative, Interests, InitiativesImages } = require('../../domain/entities');
const { InitiativeRepository } = require('../../domain/repositories');
const { uploadImage, multer } = require('../../domain/firebaseStorage');
const { loggedUser } = require('../../domain/auth')
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
  }

  createInitiative() {
    this.router.post('/initiatives', async (req, res) => {
      try {
        const initiative = await Initiative.create(req.body)
        
        if (req.body.interests) {
          const interests = await initiative.setInterests(req.body.interests);
          res.status(200).json({
            data: longJson.format(initiative),
            relationships: {
              interests
            }
          })
        }

        res.status(200).json({
          data: shortJson.format(initiative)
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

  findInitiative() {
    this.router.get('/initiatives/:initiativeId', async (req, res) => {
      try {
        const user = await loggedUser(req)

        const initiative = await Initiative.findOne({
          where: { id: req.params.initiativeId },
          include: [Interests, InitiativesImages]
        })

        const data = initiative
        data.Matches = user.Initiatives

        if (initiative) {
          return res.status(200).json({
            data: longJson.format(data)
          });
        }

        return res.status(404).json({
          message: 'Didn’t find anything here!'
        });
      }
      catch (err) {
        res.status(500).json(err)
      }
    });
  }

  findInitiativesList() {
    this.router.get('/initiatives', async (req, res) => {
      try {
        if (req.query.nearest) {
          const user = await loggedUser(req)

          if (user) {
            const result = await InitiativeRepository.findNearest(user)
            return res.status(200).json({
              data: result.map(initiative => {
                return shortJson.format(initiative)
              })
            })
          }
          else {
            return res.status(500).json({
              data: 'something is broken'
            })
          }
        }

        else {
          const initiatives = await Initiative.findAll({
            include: [Interests, InitiativesImages]
          })

          return res.status(200).json({
            data: initiatives.map(initiative => {
              return shortJson.format(initiative)
            })
          })
        }
      }
      catch (err) {
        console.log(err)
        res.status(500).json(err)
      }
    });
  }

  uploadPhotos() {
    this.router.post('/initiatives/uploadphotos/:initiativeId', multer.array('image', 5), async (req, res) => {
      try {
        const find = await Initiative.findOne({
          where: { id: req.params.initiativeId }
        })

        if (find) {
          const saveFirebase = await Promise.all(
            req.files.map(item => uploadImage(item, find.name))
          )
          if (saveFirebase) {
            const saveMySQL = await Promise.all(
              saveFirebase.map(item => {
                InitiativesImages.create({
                  InitiativeId: req.params.initiativeId,
                  image: item
                })
              })
            )

            if (saveMySQL) {
              return res.status(200).json({
                data: saveFirebase
              })
            }
          }
        }

        else {
          res.status(404).json({
            message: 'initiative not found'
          })
        }

      }
      catch (err) {
        res.status(500).json({
          message: 'something is broken'
        })
      }
    })
  }

  deleteInitiative() {
    this.router.delete('/initiatives/:initiativeId', async (req, res) => {
      try {
        if (await Initiative.findOne({where: { id: req.params.initiativeId } })) {
          if (await Initiative.destroy({ where: { id: req.params.initiativeId } })) {
            return res.status(200).json({
              message: 'Initiative has been deleted.'
            });
          }
        }
        return res.status(404).json({
          message: 'Didn’t find anything here!'
        });
      }
      catch (err){
        console.log(err)
        res.status(500).json({
          message: 'something is broken'
        });
      }
    });
  }

};