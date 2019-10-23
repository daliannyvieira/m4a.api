const request = require('request-promise');
const { login, loggedUser } = require('../../domain/auth');
const UserJson = require('../responses/users-long');

module.exports = class Login {
  constructor(router) {
    this.router = router;
  }

  expose() {
    this.validateFacebook();
    this.validateGoogle();
    this.verifyToken();
  }

  validateFacebook() {
    this.router.post('/login/facebook', async (req, res) => {
      try {
        const UserAccessToken = req.body.user_access_token;
        const fields = 'email,name,picture.width(500).height(500)';
        const options = {
          method: 'GET',
          uri: 'https://graph.facebook.com/v2.8/me',
          qs: {
            access_token: UserAccessToken,
            fields,
          },
        };
        const facebookData = await request(options);
        console.log('facebook', facebookData)
        const token = await login(JSON.parse(facebookData).email);
        if (token) {
          return res.status(201).json({
            data: token,
          });
        }
        return res.status(404).json({
          errors: [{
            message: 'Didn’t find anything here!',
          }],
        });
      } catch (err) {
        return res.status(500).json({
          errors: [{
            message: JSON.parse(err.error).error.message,
          }],
        });
      }
    });
  }

  validateGoogle() {
    this.router.post('/login/google', async (req, res) => {
      try {
        const UserAccessToken = req.body.user_access_token;
        const options = {
          method: 'GET',
          uri: 'https://www.googleapis.com/oauth2/v1/tokeninfo',
          qs: {
            access_token: UserAccessToken,
          },
        };
        const googleData = await request(options);
        const token = await login(JSON.parse(googleData).email);
        if (token) {
          return res.status(201).json({
            data: token,
          });
        }
        return res.status(404).json({
          errors: [{
            message: 'Didn’t find anything here!',
          }],
        });
      } catch (err) {
        return res.status(500).json({
          errors: [{
            message: JSON.parse(err.error).error_description,
          }],
        });
      }
    });
  }

  verifyToken() {
    this.router.get('/login/verify', async (req, res) => {
      try {
        const user = await loggedUser(req);
        if (user) {
          return res.status(200).json({
            data: {
              type: 'User',
              id: user.id,
              attributes: UserJson.format(user),
              relationships: {
                interests: user.Interests && user.Interests.map((interest) => ({
                  id: interest.id,
                  description: interest.description,
                  type: interest.type,
                })),
              },
            },
          });
        }
        return res.status(401).json({
          errors: [{
            message: 'Invalid token',
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
