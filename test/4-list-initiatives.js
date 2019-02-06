const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const server = require('../index');
const should = chai.should();
const expect = chai.expect;

describe('List Users', () => {

  let token = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImRhbGlAZ21pYWwuY29tIiwiaWF0IjoxNTQ3NjU5ODkyLCJleHAiOjE1NDgyNjQ2OTJ9.4z3XN0h9lLc4UOWp1V8B12Zytw6k9OVV8szF8i2ATA8'

  it('should list ALL initiatives on /initiatives GET', (done) => {
    chai.request(server.app)
      .get('/initiatives')
      .set('Authorization', token)
      .end((err, res) => {
        expect(res).to.have.status(200);
        done();
      });
  });

  it('should list ALL initiatives and their interests on /initiatives GET', (done) => {
    chai.request(server.app)
      .get('/initiatives?include=initiatives-interests')
      .set('Authorization', token)
      .end((err, res) => {
        expect(res.body).to.have.property('data');
        expect(res).to.have.status(200);
        done();
      });
  });

});