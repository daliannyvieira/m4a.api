const jwt = require('jsonwebtoken');
const url = require('url');
const { Op } = require('sequelize');
const {
  User, Interests, Initiative, Matches,
} = require('./entities');

const env = process.env.NODE_ENV || 'development';
const config = require(`${__dirname}/../config/config.js`)[env];

const UsersLong = require('../app/responses/users-long');

const secret = config.jwtSecret;

const handleDecode = async (req) => {
  try {
    const authorization = req.header('Authorization');
    const token = authorization.replace('Bearer ', '');
    const decoded = jwt.verify(token, secret);

    return decoded;
  } catch (err) {
    return undefined;
  }
};

const auth = async (data) => jwt.sign({
  sub: data.id,
  info: data,
  aud: 'Match4Action',
  iss: 'Match4Action',
},
secret, {
  expiresIn: '7d',
});


const loggedUser = async (req) => {
  try {
    const authorization = req.header('Authorization');
    const token = authorization.replace('Bearer ', '');
    const decoded = jwt.verify(token, secret);

    return await User.findOne({
      where: { email: decoded.info.email },
      include: [Interests],
    });
  } catch (err) {
    return undefined;
  }
};

const requiresAuth = (allowedRoutes) => (req, res, next) => {
  if (req.originalUrl.includes('docs')) return next();

  let queryString;

  console.log('req.', req.originalUrl);

  if (req.query) {
    queryString = url.parse(req.url).query;
  }

  const link = allowedRoutes.find((item) => {
    if (queryString) {
      return `${item.path}?${queryString}` === req.originalUrl;
    }
    return item.path === req.originalUrl;
  });

  if (link && link.methods.includes(req.method)) {
    return next();
  }
  const authorization = req.header('Authorization');

  if (!authorization) {
    return res.status(401).json({ message: 'No authorization header found' });
  }

  try {
    const token = authorization.replace('Bearer ', '');
    jwt.verify(token, secret);
    next();
  } catch (err) {
    return res.status(401).json({
      message: 'Invalid token',
    });
  }
};

const routerList = [
  {
    path: '/',
    methods: ['GET'],
  },
  {
    path: '/user',
    methods: ['POST'],
  },
  {
    path: '/interests',
    methods: ['GET'],
  },
  {
    path: '/interests/Fields',
    methods: ['GET'],
  },
  {
    path: '/interests/Causes',
    methods: ['GET'],
  },
  {
    path: '/interests/SDGs',
    methods: ['GET'],
  },
  {
    path: '/interests/Skills',
    methods: ['GET'],
  },
  {
    path: '/login/facebook',
    methods: ['POST'],
  },
  {
    path: '/login/google',
    methods: ['POST'],
  },
  {
    path: '/login/verify',
    methods: ['GET'],
  },
  {
    path: '/organization/initiatives/report',
    methods: ['GET'],
  },
];

const login = async (socialData) => {
  let user;
  if (!socialData.email && !socialData.id) {
    user = await User.findOne({
      where: { email: socialData },
      include: [
        Interests,
      ],
    });
  }

  if (socialData.email) {
    user = await User.findOne({
      where: { email: socialData.email },
      include: [
        Interests,
      ],
    });
  }

  if (socialData.id) {
    user = await User.findOne({
      where: { facebookId: socialData.id },
      include: [
        Interests,
      ],
    });
  }

  if (!user) {
    return undefined;
  }

  let initiatives;
  let matches;
  if (user) {
    initiatives = await Initiative.findAll({
      where: {
        UserId: user.id,
        muted: {
          [Op.or]: [false, null],
        },
        deletedAt: null,
      },
    });
    matches = await Matches.findAll({
      where: {
        UserId: user.id,
        liked: true,
      },
      include: [
        {
          model: Initiative,
          where: {
            muted: {
              [Op.or]: [false, null],
            },
            deletedAt: null,
          },
        },
      ],
    });
  }
  const data = {
    id: user.id,
    ...UsersLong.format(user),
    facebookId: user.facebookId && user.facebookId,
    Interests: user.Interests.map((item) => ({
      id: item.id,
      description: item.description,
      type: item.type,
    })),
    listening_groups: [
      ...initiatives.map((item) => ({
        id: item.id,
        name: item.name,
      })),
      ...matches.map((item) => ({
        id: item.Initiative.id,
        name: item.Initiative.name,
      })),
    ],
  };
  return auth(data);
};

module.exports = {
  login, loggedUser, requiresAuth, routerList, handleDecode,
};
