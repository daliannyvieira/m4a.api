'use strict';
const { login, loggedUser } = require('../../domain/auth');
const request = require('request-promise');
const UserRelationships = require('../responses/users-relationships');

module.exports = class Login {
  constructor(router) {
    this.router = router;
  }

  expose() {
    this.getToken();
    this.verifyToken();
  }

  getToken() {
    this.router.post('/login', async (req, res) => {
      try {
        const { user_access_token } = req.body;
        const fields = "email,name,picture.width(500).height(500)";
        const options = {
          method: 'GET',
          uri: `https://graph.facebook.com/v2.8/me`,
          qs: {
            access_token: user_access_token,
            fields: fields
          }
        };
        const facebookData = await request(options);
        const token = await login(JSON.parse(facebookData).email);
        if (token) {
          return res.status(200).json({ data: token })
        }
        return res.status(404).json({
          message: 'Didn’t find anything here!'
        })
      }
      catch (err) {
        console.log('err', err)
        res.status(500).json(err)
      }
    });
  }

  verifyToken() {
    this.router.get('/login/verify', async (req, res) => {
      try {
        const user = await loggedUser(req)
        if (user) {
          return res.status(200).json({
            data: UserRelationships.format(user)
          });
        }
        return res.status(401).end()
      }
      catch (err) {
        console.log(err)
        return res.status(500).json(err)
      }
    });
  }

};