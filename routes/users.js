const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const pool = require('../db/connection');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const genres_types = [ 'pop', 'rap', 'country', 'hip hop', 'rock', 'trap' ];

router.get('/signup', (req, res) => {
	res.render('pages/signup', { errors: null });
});

router.post(
	'/sign_up',
	[
		check('password', 'password is too short').isLength({ min: 5 }),
		check('username', 'username is too long').isLength({ max: 15 }),
		check('username', 'username is too short').isLength({ min: 5 }),
	],
	(req, res) => {
		var username = req.body.username.toLowerCase();
		var password = req.body.password;
		var confirmPassword = req.body.confirmPassword;
		var msg;
		pool.query(
			`SELECT * FROM users WHERE LOWER(username) = LOWER('${username}')`,
			(error, results) => {
				if (error) {
					throw error;
				}

				if (results.rows.length != 0) {
					msg = 'Username is already in use';
					res.status(400).render('pages/signup', { errors: [ { msg: msg } ] });
				} else {
					var errors = validationResult(req);
					if (!(password === confirmPassword)) {
						msg = 'Passwords do not match';
						res.status(400).render('pages/signup', { errors: [ { msg: msg } ] });
					} else if (!errors.isEmpty()) {
						res.status(400).render('pages/signup', errors);
					} else {
						bcrypt.hash(password, saltRounds, (err, hash) => {
							pool.query(
								`INSERT INTO users (username, password) VALUES ('${username}', '${hash}')`,
								(error) => {
									if (error) {
										throw error;
									}
								}
							);
						});

						req.session.username = username;
						res.redirect('/play');
					}
				}
			}
		);
	}
);

router.get('/login', (req, res) => {
	res.render('pages/login', { errors: null });
});

router.post('/sign_in', (req, res) => {
	var username = req.body.username.toLowerCase();
	var password = req.body.password;
	var errors = null;
	// hash
	// validate on db
	var msg = 'Incorrect username and/or password';
	pool.query(
		`SELECT password FROM users WHERE LOWER(username) = '${username}'`,
		(error, results) => {
			if (error) {
				throw error;
			}

			if (results.rows.length == 0) {
				res.render('pages/login', { errors: [ { msg: msg } ] });
			} else {
				const hash = results.rows[0].password.toString();
				bcrypt.compare(password, hash, function(err, response) {
					if (response) {
						req.session.username = username;
						res.redirect('/play');
					} else {
						msg = 'Incorrect username and/or password';
						res.render('pages/login', { errors: [ { msg: msg } ] });
						return msg;
					}
				});
			}
		}
	);
});

router.get('/logout', (req, res) => {
	if (req.session.username) {
		req.session.destroy((err) => {});
		res.redirect('/');
	} else {
		res.redirect('/users/login');
	}
});

router.get('/profile', (req, res) => {
	if (req.session.username) {
		pool.query(
			`SELECT score, dateplayed, genre, mode FROM scores WHERE LOWER(username) = '${req.session
				.username}' ORDER BY dateplayed DESC LIMIT 5`,
			(error, results) => {
				if (error) {
					throw error;
				}
				res.render('pages/profile', {
					username: req.session.username,
					results: results.rows,
					selected: 'Recent Scores',
					genres: genres_types,
				});
			}
		);
	} else {
		res.redirect('/users/login');
	}
});

router.get('/profile/:data', (req, res) => {
	if (req.session.username) {
		if (req.params.data == 'Overall Stats') {
			pool.query(
				`SELECT SUM(score) as total, COUNT(username) as games FROM scores WHERE LOWER(username) = '${req
					.session.username}' GROUP BY LOWER(username)`,
				(error, results) => {
					if (error) {
						throw error;
					}
					res.render('pages/profile', {
						username: req.session.username,
						results: results.rows,
						selected: req.params.data,
						genres: genres_types,
					});
				}
			);
		} else {
			pool.query(
				`SELECT SUM(score) as total, COUNT(username) as games FROM scores WHERE (LOWER(username) = '${req
					.session.username}' AND genre = '${req.params.data}') GROUP BY LOWER(username)`,
				(error, results) => {
					if (error) {
						throw error;
					}
					res.render('pages/profile', {
						username: req.session.username,
						results: results.rows,
						selected: req.params.data,
						genres: genres_types,
					});
				}
			);
		}
	} else {
		res.redirect('/users/login');
	}
});

router.get('/reset', (req, res) => {
	if (req.session.username) {
		res.render('pages/reset', { username: req.session.username, errors: null });
	} else {
		res.redirect('/users/profile');
	}
});

router.post('/reset', (req, res) => {
	var oldpassword = req.body.Currentpassword;
	var newpassword = req.body.Newpassword;
	var confirm = req.body.ConfirmNewpassword;
	var username = req.session.username;
	var msg = 'Passwords do nost match';

	// hash old password and compare this with password in database
	pool.query(
		`SELECT password FROM users WHERE LOWER(username) = '${username}'`,
		(error, results) => {
			if (error) {
				throw error;
			}
			const hash = results.rows[0].password.toString();
			bcrypt.compare(oldpassword, hash, function(err, response) {
				if (response) {
					// check to new if new passwords match
					if (newpassword == confirm) {
						// hash new password and update db with new passwords
						bcrypt.hash(newpassword, saltRounds, (err, hash) => {
							pool.query(
								`UPDATE users SET password = '${hash}' WHERE LOWER(username) = '${username}'`
							);
						});
						res.redirect('/play');
					} else {
						res.render('pages/reset', {
							username: req.session.username,
							errors: [ { msg: msg } ],
						});
					}
				} else {
					msg = 'Incorrect password';
					res.render('pages/reset', {
						username: req.session.username,
						errors: [ { msg: msg } ],
					});
				}
			});
		}
	);
});

router.get('/leaderboard', (req, res) => {
	if (req.session.username) {
		// just in case we access this straigh after a game, we reset the genre and playtype
		req.session.genre = null;
		req.session.playtype = null;

		pool.query(`select * from scores order by score desc limit 10`, (err, results) => {
			if (err) {
				throw err;
			} else {
				res.render('pages/leaderboard', {
					username: req.session.username,
					data: results.rows,
					bestgenre: 'placeholder for now',
					genre: 'placeholder for now',
					gamesplayed: 'placeholder for now',
					genres: genres_types,
					selected: req.params.genre,
				});
			}
		});
	} else {
		res.redirect('/users/login');
	}
});

router.get('/leaderboard/:genre', (req, res) => {
	if (req.session.username) {
		// just in case we access this straigh after a game, we reset the genre and playtype
		req.session.genre = null;
		req.session.playtype = null;

		pool.query(
			`select username, score, genre from scores where genre = '${req.params
				.genre}' order by score desc limit 10`,
			(err, results) => {
				if (err) {
					throw err;
				} else {
					res.render('pages/leaderboard', {
						username: req.session.username,
						data: results.rows,
						bestgenre: 'placeholder for now',
						gamesplayed: 'placeholder for now',
						genres: genres_types,
						selected: req.params.genre,
					});
				}
			}
		);
	} else {
		res.redirect('/users/login');
	}
});

router.post('/upscore', (req, res) => {
	let username = req.session.username;
	let score = req.body.userScore;
	let genre = req.session.genre;
	let gamemode = 'single';
	let d = new Date();

	//format date properly
	dformat =
		[ d.getFullYear(), d.getMonth() + 1, d.getDate() ].join('-') +
		' ' +
		[ d.getHours(), d.getMinutes(), d.getSeconds() ].join(':');

	pool.query(
		`INSERT INTO scores values ('${username}',${score}, '${gamemode}', '${genre}', '${dformat}')`,
		function(err, res) {
			if (err) {
				return console.log(err);
			}
		}
	);
});
module.exports = router;
