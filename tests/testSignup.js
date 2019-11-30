/***************************************************************************************************/
/*               This test page checks username and password constraints                           */
/***************************************************************************************************/

var expect = require('chai').expect;
var app = require('../index');
var request = require('supertest');

/*******************************************************************************************/
/*                 set up the data we need to pass to the login method                     */
/*******************************************************************************************/

const userCredentials = {
	username: 'userone',
	password: '12345',
};

/***************************************************************************************************/
/*  this test says: make a POST to the /sign_in route with the username: userone, password: 12345  */
/*  after the POST has completed, make sure the status code is 200                                 */
/*  also make sure that the user has been directed to the /play page                               */
/***************************************************************************************************/

var authenticatedUser = request.agent(app);
before(function(done) {
	authenticatedUser.post('/users/sign_in').send(userCredentials).end(function(err, response) {
		expect(response.statusCode).to.equal(302);
		expect('Location', '/play');
		done();
	});
});

/***************************************************************************************************/
/*                 BELOW ARE THE TEST CASES FOR ACCOUNTS THAT WILL HAVE ERRORS                     */
/***************************************************************************************************/

const confirm_pass_wrong = {
	username: 'userone2',
	password: '12345',
	confirmPassword: '123456',
};
const username_exists = {
	username: 'userone',
	password: '12345',
	confirmPassword: '12345',
};
const pass_short = {
	username: 'userone3',
	password: '123',
	confirmPassword: '123',
};
const user_short = {
	username: 'user',
	password: '12345',
	confirmPassword: '12345',
};
const user_long = {
	username: 'user_lengthlongerthan15',
	password: '12345',
	confirmPassword: '12345',
};

/***************************************************************************************************/
/* BELOW ARE THE TEST CASES FOR ERRORS WE SHOULD GET IF WE HAVE INCORRECT USERNAME AND/OR PASSWORD */
/***************************************************************************************************/

describe('Sign up and Sign in testing', function() {
	//checks to see if we get passwords do not match error if we create an account and entire fields incorrectly
	it('Checks to see if password matches confirmPassword', function(done) {
		request(app).post('/users/sign_up').send(confirm_pass_wrong).end(function(err, response) {
			expect(response.statusCode).to.equal(400);
			expect(response.text).to.include('Passwords do not match');
			done();
		});
	});

	//checks to see if we get username already exists if we create an account which already uses that username
	it('Checks to see if username is valid', function(done) {
		request(app).post('/users/sign_up').send(username_exists).end(function(err, response) {
			expect(response.statusCode).to.equal(400);
			expect(response.text).to.include('Username is already in use');
			done();
		});
	});

	//checks to see if we get password is too short if we create an account with a password with length less than 5
	it('Checks to see if password is to short', function(done) {
		request(app).post('/users/sign_up').send(pass_short).end(function(err, response) {
			expect(response.statusCode).to.equal(400);
			expect(response.text).to.include('password is too short');
			done();
		});
	});

	//checks to see if we get username is too short if we create an account with a username with length less than 5
	it('Checks to see if username is to short', function(done) {
		request(app).post('/users/sign_up').send(user_short).end(function(err, response) {
			expect(response.statusCode).to.equal(400);
			expect(response.text).to.include('username is too short');
			done();
		});
	});

	//checks to see if we get username is too long if we create an account with a username with length greater than 15
	it('Checks to see if username is to long', function(done) {
		request(app).post('/users/sign_up').send(user_long).end(function(err, response) {
			expect(response.statusCode).to.equal(400);
			expect(response.text).to.include('username is too long');
			done();
		});
	});
});
