const express = require('express');
const bodyParser = require('body-parser');
const { requiresAuth, routerList } = require('./domain/auth');

const StatusService = require('./app/services/status-service');
const UserService = require('./app/services/user-service');
const InitiativeService = require('./app/services/initiative-service.js');
const InterestService = require('./app/services/interest-service');
const MatchService = require('./app/services/match-service');
const Login = require('./app/services/auth-service');
const OrganizationService = require('./app/services/organization-service');

const port = 3000;

class Server {
  constructor() {
    this.app = express();
    this.router = express.Router();
  }

  setup() {
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization',
      );
      if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
        return res.status(200).json({});
      }
      next();
    });
    this.app.enable('trust proxy');
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: true }));
    this.app.use(requiresAuth(routerList));
  }

  start() {
    new StatusService(this.router).expose();
    new UserService(this.router).expose();
    new InitiativeService(this.router).expose();
    new Login(this.router).expose();
    new InterestService(this.router).expose();
    new MatchService(this.router).expose();
    new OrganizationService(this.router).expose();

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
