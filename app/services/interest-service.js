'use strict';
const { Interests } = require('../../domain/entities');

module.exports = class Initiatives {
  constructor(router) {
    this.router = router;
  }

  expose() {
    this.findInterestList();
    this.findInterestByType();
    // this.createInterestList();
    // this.createInterest();
  }

  findInterestList() {
    this.router.get('/interests', async (req, res) => {
      try {
        res.status(200).json({
          data: await Interests.findAll()
        })
      }
      catch (err) {
        res.status(500).json(err)
      }
    });
  }

  findInterestByType() {
    this.router.get('/interests/:type', async (req, res) => {
      try {
        res.status(200).json({
          data: await Interests.findAll({
            where: { type: req.params.type }
          })
        })
      }
      catch (err) {
        res.status(500).json(err)
      }
    });
  }

  // Hidden this methods for now.

  // createInterestList() {
  //   this.router.post('/interestlist/:type', async (req, res) => {
  //     try {
  //       if (req.body.length > 1) {
  //         const interestsList = await Promise.all(
  //           req.body.map(interest => {
  //               return Interests.create({
  //                 description: interest.description,
  //                 type: req.params.type
  //               })
  //             }
  //           )
  //         )
  //         return res.status(200).json({ data: interestsList })
  //       }
  //       return res.status(200).json({ data: 'needs to be list' })
  //     }
  //     catch (err) {
  //       res.status(500).json(err)
  //     }
  //   });
  // }

  // createInterest() {
  //   this.router.post('/interest/:type', async (req, res) => {
  //     try {
  //       return res.status(200).json({
  //         data: await Interests.create({
  //           description: req.body.description,
  //           type: req.params.type
  //         })
  //       })
  //     }
  //     catch (err) {
  //       res.status(500).json(err)
  //     }
  //   });
  // }

};