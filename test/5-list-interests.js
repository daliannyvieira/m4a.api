process.env.NODE_ENV = 'test';
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../index');
let should = chai.should();

chai.use(chaiHttp);

describe('GET /interests', () => {

  it('it should GET all interests', (done) => {
    chai.request(server.app)
      .get('/interests')
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.an('object');
        res.body.should.have.property('data');
        res.body.data.should.be.a('array');
        res.body.data[0].should.have.property('id');
        res.body.data[0].should.have.property('description');
        res.body.data[0].should.have.property('type');
        done();
      });
  });

  it('it should GET all interests filtered by Causes', (done) => {
    chai.request(server.app)
      .get('/interests/Causes')
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.an('object');
        res.body.should.have.property('data');
        res.body.data.should.be.a('array');
        res.body.data[0].should.have.property('id');
        res.body.data[0].should.have.property('description');
        res.body.data[0].should.have.property('type');
        res.body.data[0].should.have.property('type').eql('Causes');
        done();
      });
  });

  it('it should GET all interests filtered by SDGs', (done) => {
    chai.request(server.app)
      .get('/interests/SDGs')
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.an('object');
        res.body.should.have.property('data');
        res.body.data.should.be.a('array');
        res.body.data[0].should.have.property('id');
        res.body.data[0].should.have.property('description');
        res.body.data[0].should.have.property('type');
        res.body.data[0].should.have.property('type').eql('SDGs');
        done();
      });
  });

  it('it should GET all interests filtered by Skills', (done) => {
    chai.request(server.app)
      .get('/interests/Skills')
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.an('object');
        res.body.should.have.property('data');
        res.body.data.should.be.a('array');
        res.body.data[0].should.have.property('id');
        res.body.data[0].should.have.property('description');
        res.body.data[0].should.have.property('type');
        res.body.data[0].should.have.property('type').eql('Skills');
        done();
      });
  });

  it('it should GET all interests filtered by Fields', (done) => {
    chai.request(server.app)
      .get('/interests/Fields')
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.an('object');
        res.body.should.have.property('data');
        res.body.data.should.be.a('array');
        res.body.data[0].should.have.property('id');
        res.body.data[0].should.have.property('description');
        res.body.data[0].should.have.property('type');
        res.body.data[0].should.have.property('type').eql('Fields');
        done();
      });
  });

});