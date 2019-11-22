var expect = require('chai').expect;
var app = require('../index');
var request = require('supertest');
//const PORT = process.env.PORT || 5001

//set up the data we need to pass to the login method
const userCredentials = {
  username: 'kevin',
  password: '12345'
}
//let's login the user before we run any tests
var authenticatedUser = request.agent(app);
before(function(done){
  authenticatedUser
    .post('/users/sign_in')
    .send(userCredentials)
    .end(function(err, response){
      expect(response.statusCode).to.equal(200);
      expect('Location', '/play');
      done();
    });
});
//this test says: make a POST to the /sign_in route with the username: kevin, password: 12345
//after the POST has completed, make sure the status code is 200
//also make sure that the user has been directed to the /play page


describe('GET /profile', function(done){
//if the user is logged in we should get a 200 status code
  it('should return a 200 response if the user is logged in', function(done){
    authenticatedUser.get('/profile')
    .expect(200, done);
  });
//if the user is not logged in we should get a 302 response code and be directed to the /login page
  it('should return a 302 response and redirect to /login', function(done){
    request(app).get('/profile')
    .expect('Location', '/login')
    .expect(302, done);
  });
});
