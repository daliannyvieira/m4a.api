process.env.NODE_ENV = 'test';

let { User } = require('../domain/entities');

let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../index');
let should = chai.should();

chai.use(chaiHttp);

describe('Users', () => {
/*  beforeEach((done) => {
      User.destroy({ where: {}, truncate: true }, (err) => {
        done();
      })
  });
*/

  describe('/POST user', () => {
    it('it should POST an user', (done) => {
      let user = {
        "email": "teste@gmail.com",
        "username": "teste",
        "userProfile": "Volunteer",
        "interests": [40, 41, 42]
      }
      chai.request(server.app)
        .post('/users')
        .send(user)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.an('object');
          res.body.should.have.property('data');
          res.body.should.have.property('token');
          res.body.should.have.property('relationships');
          res.body.data.should.have.property('type').eql('User');
          res.body.data.should.have.property('attributes');
          res.body.relationships.should.have.property('interests');
          res.body.relationships.interests.should.be.a('array');
          done();
        });
    });
  });
});