const express = require('express');
const router = express.Router();
const music = require('../scripts/music');
const fs = require('fs');

router.get('/', (req, res) => {
	if (req.session.username) {
		req.session.playtype = null;
		req.session.genre = null;
		res.render('pages/landing', { username: req.session.username });
	} else {
		res.redirect('/');
	}
});

router.get('/playtype/single', (req, res) => {
	if (req.session.username) {
		req.session.playtype = req.params.playtype;
		res.render('pages/playlists', { username: req.session.username });
	} else {
		res.redirect('/');
	}
});

router.get('/playlists', (req, res) => {
	if (req.session.username) {
		req.session.genre = null;
		res.render('pages/playlists');
	} else {
		res.redirect('/');
	}
});

router.get('/genre/:genre', (req, res) => {
	if (req.session.username) {
		req.session.genre = req.params.genre;
		var results = {
			username: req.session.username,
			genre: capitalize_words(req.session.genre),
		};

		// redirect to the play page passing req.session.genre as the genre variable
		res.render('pages/game_mc', results);
	} else {
		res.redirect('/');
	}
});

router.post('/get_playlist', (req, res) => {
	if (req.session.genre == 'demo1') {
		fs.readFile('demo1.json', 'utf-8', function(err, contents) {
			console.log(contents);
			res.send(contents);
		});
	} else if (req.session.genre == 'demo2') {
		fs.readFile('demo2.json', 'utf-8', function(err, contents) {
			console.log(contents);
			res.send(contents);
		});
	} else {
		music.getRelatedArtists(req.session.genre, function(returnVal) {
			music.getRelatedSongs(returnVal, function(finalPlaylist) {
				console.log(finalPlaylist);
				res.send(finalPlaylist);
			});
		});
	}
});

router.get('/playtype/multiplayer', (req, res) => {
	if (req.session.username) {
		req.session.playtype = req.params.playtype;
		res.render('pages/multiplayer', { username: req.session.username, errors: null });
	} else {
		res.redirect('/users/login');
	}
});

router.get('/multiplayer/create', (req, res) => {
	if (req.session.username) {
		res.render('pages/lobby', { username: req.session.username, room: 'create', code: null });
	} else {
		res.redirect('/users/login');
	}
});

function capitalize_words(str) {
	return str.replace(/\w\S*/g, function(txt) {
		return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
	});
}

module.exports = router;
