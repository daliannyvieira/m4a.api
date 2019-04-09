var jwt = require('jsonwebtoken');
const { User, Interests, Initiative } = require('./entities');
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.js')[env];

const secret = config.jwtSecret

const login = async (email) => {
  const user = await User.findOne({
    where: { email: email },
  })
  if (!user) {
    return undefined
  }
  return jwt.sign({
    email: user.email },
    secret, {
    expiresIn: '7d'
  });
}

const loggedUser = async (req) => {
  try {
    const authorization = req.header('Authorization')
    const token = authorization.replace('Bearer ', '')
    const info = jwt.verify(token, secret);

    return await User.findOne({
      where: { email: info.email },
      include: [Interests, {'model': Initiative, as: 'UserInitiatives'}, Initiative]
    })

  }
  catch (err) {
    return undefined
  }
}

const requiresAuth = (allowedRoutes) => {
  return (req, res, next) => {
    if(req.originalUrl.includes('docs')) return next()
    const url = allowedRoutes.find(item => item.path === req.originalUrl)
    if (url && url.methods.includes(req.method)) {
      return next()
    }
    const authorization = req.header('Authorization')
    if (!authorization) {
      return res.status(401).json({ message: 'No authorization header found' });
    }
    try {
      const token = authorization.replace('Bearer ', '')
      jwt.verify(token, secret);
      next()
    }
    catch (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }
  }
}


module.exports = { login, loggedUser, requiresAuth };