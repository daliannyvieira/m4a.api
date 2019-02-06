const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const server = require('../index');
const should = chai.should();
const expect = chai.expect;

describe('Create a new initiative', () => {
  let token = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImRhbGlAZ21pYWwuY29tIiwiaWF0IjoxNTQ3NjU5ODkyLCJleHAiOjE1NDgyNjQ2OTJ9.4z3XN0h9lLc4UOWp1V8B12Zytw6k9OVV8szF8i2ATA8'

  let initiative = {
    "name": "vainawebinho1",
    "UserId": 1,
      "latlong": {
        "type": "Point",
        "coordinates": [
          39.807222,
          -76.984722
        ]
      },
      "InitiativesInterests": [
        {
          "interestDescription": "Cooking",
          "interestType": "Skills"
        }
      ]
  }

  it('should create an initiative', (done) => {

    chai.request(server.app)
      .post('/initiatives')
      .set('Authorization', token)
      .send(initiative)
      .end((err, res, body) => {
        if (err) {
          done(err);
        } else {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.have.property('data');
          done();
        }
      });

  });

});