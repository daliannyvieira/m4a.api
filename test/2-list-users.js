process.env.NODE_ENV = 'test';
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../index');
let should = chai.should();

chai.use(chaiHttp);

let token = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Imp1bGlhbmFAZ21pYWwuY29tIiwiaWF0IjoxNTQ4OTYzNjUzLCJleHAiOjE1NDk1Njg0NTN9.C90tZd2cd9NpAjYnIEUWF2CbacfQu1_uQPo7sYMnCoY'

describe('GET /users', () => {

  it('it should GET all users', (done) => {
    chai.request(server.app)
      .get('/users')
      .set('Authorization', token)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.an('object');
        res.body.should.have.property('data');
        res.body.data.should.be.a('array');
        res.body.data[0].should.have.property('id');
        res.body.data[0].should.have.property('type').eql('User');
        res.body.data[0].should.have.property('attributes');
        done();
      });
  });

});

describe('GET /user/ID', () => {

  it('it should GET an user', (done) => {
    chai.request(server.app)
      .get('/users/150')
      .set('Authorization', token)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.an('object');
        res.body.should.have.property('data');
        res.body.data.should.be.an('object');
        res.body.data.should.have.property('id');
        res.body.data.should.have.property('type').eql('User');
        res.body.data.should.have.property('attributes');
        res.body.data.attributes.should.have.property('interests');
        res.body.data.attributes.interests.should.be.a('array');
        done();
      });
  });

});