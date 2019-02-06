const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const server = require('../index');
const should = chai.should();
const expect = chai.expect;

describe('Check healthy status', () => {
  it('should return healthy ok', (done) => {
    chai.request(server.app)
      .get('/')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.have.property('message');
        expect(res.body.message).to.equal('healthy ok');
        done();
      });
  });
});

describe('Check unauthorized routes', () => {
  it('/users should return unauthorized', (done) => {
    chai.request(server.app)
      .get('/users')
      .end((err, res) => {
        expect(res).to.have.status(401);
        expect(res).to.be.json;
        expect(res.body).to.have.property('message');
        expect(res.body.message).to.equal('No authorization header found');
        done();
      });
  });
});