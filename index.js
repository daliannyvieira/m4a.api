'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const { requiresAuth } = require('./domain/auth');

// services
const StatusService = require('./app/services/status-service');
const UserService = require('./app/services/user-service');
const InitiativeService = require('./app/services/initiative-service.js');
const InterestService = require('./app/services/interest-service');
const Login = require('./app/services/auth-service');

const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./config/swagger.json');
const port = 3000

class Server {
  constructor () {
    this.app = express();
    this.router = express.Router();
  }

  setup () {    
    this.app.use((req, res, next) => {
      res.header("Access-Control-Allow-Origin", "*");
      res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
      );
      if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
        return res.status(200).json({});
      }
      next();
    });
    this.app.enable('trust proxy');
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({extended: true}));
    this.app.use(requiresAuth([
      {
        path: '/',
        methods: ['GET']
      },
      {
        path: '/users',
        methods: ['POST']
      },
      {
        path: '/interests',
        methods: ['GET']
      },
      {
        path: '/interests/Fields',
        methods: ['GET']
      },
      {
        path: '/interests/Causes',
        methods: ['GET']
      },
      {
        path: '/interests/SDGs',
        methods: ['GET']
      },
      {
        path: '/interests/Skills',
        methods: ['GET']
      },
      {
        path: '/login',
        methods: ['POST']
      },
      {
        path: '/login/verify',
        methods: ['GET']
      }
    ])
  )}
  start () {
    new StatusService(this.router).expose();
    new UserService(this.router).expose();
    new InitiativeService(this.router).expose();
    new Login(this.router).expose();
    new InterestService(this.router).expose();

    this.app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    this.app.use('/', this.router);
    this.app.listen(port, () => {
      console.log(`Readyy! http://localhost:${port}/`);
    });
  }
}

const api = new Server();

api.setup();
api.start();

module.exports = api;