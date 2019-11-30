const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const expressSession = require('express-session');
const bodyparser = require('body-parser');
const users = require('./routes/users');
const gameplay = require('./routes/play');
const music = require('./scripts/music');
const http = require('http');
const pool = require('./db/connection');
const fs = require('fs');
const socketIO = require('socket.io');
const PORT = process.env.PORT || 5000;

// Load environment variables
// Need this for testing
require('dotenv').config();

const app = express();

// Configuration settings
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyparser.json());
app.use(
	expressSession({ secret: process.env.SESSION_SECRET, saveUninitialized: false, resave: false })
);
app.use(cookieParser());
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
	if (req.session.username) {
		res.redirect('play');
	} else {
		res.render('pages/index');
	}
});

// Routers
app.use('/users', users);
app.use('/play', gameplay);

var rooms = [];

// Join
app.post('/multiplayer/join', (req, res) => {
	if (req.session.username) {
		var roomCode = req.body.roomCode;
		if (roomCode in rooms && !rooms[roomCode].started) {
			res.render('pages/lobby', { username: req.session.username, room: 'join', code: roomCode });
		} else {
			res.render('pages/multiplayer', {
				username: req.session.username,
				errors: [ { msg: 'Invalid code. Please try again' } ],
			});
		}
	} else {
		res.redirect('/login');
	}
});

app.get('*', function(req, res) {
	res
		.status(404)
		.send('ERROR 404: The page you requested is invalid or is missing, please try something else');
});

console.log('Running ' + process.env.NODE_ENV + ' environment...');
if (process.env.NODE_ENV == 'production') {
	console.log('------STARTING SONG DATABASE UPDATE------');
	music.updateSongDB();
	setTimeout(function() {
		music.updateSongDBSpecific('2016-08-27');
	}, 30000);

	setTimeout(function() {
		music.updateSongDBSpecific('2013-08-27');
	}, 60000);

	setTimeout(function() {
		music.updateSongDBSpecific('2010-08-27');
	}, 90000);

	setTimeout(function() {
		music.updateSongDBSpecific('2007-08-27');
	}, 120000);

	setTimeout(function() {
		music.updateSongDBSpecific('2004-08-27');
	}, 150000);

	setInterval(music.alertUpdate, 10 * 24 * 60 * 60 * 1000 - 20);
	setInterval(music.updateSongDB, 10 * 24 * 60 * 60 * 1000);
}

// ***** MULTIPLAYER *****

//User goes press create room

// generate alphanumeric lobby code of length 4
// eg: 4GK9, F671, KP2L
function generateCode() {
	var code = '';
	// alphanumeric chars
	var chars = [
		'A',
		'B',
		'C',
		'D',
		'E',
		'F',
		'G',
		'H',
		'I',
		'J',
		'K',
		'L',
		'M',
		'N',
		'O',
		'P',
		'Q',
		'R',
		'S',
		'T',
		'U',
		'V',
		'W',
		'X',
		'Y',
		'Z',
		'0',
		'1',
		'2',
		'3',
		'4',
		'5',
		'6',
		'7',
		'8',
		'9',
	];
	for (var i = 6; i > 0; --i) {
		code += chars[Math.floor(Math.random() * chars.length)];
	}
	return code;
}

var server = app.listen(PORT, () => console.log(`Listening on ${PORT}`));

module.exports = app;

const io = socketIO(server);

io.on('connection', (socket) => {
	console.log('made socket connection');
	var roomID;
	var username;
	socket.on('create', function() {
		let roomCode;

		do {
			roomCode = generateCode();
		} while (roomCode in rooms);

		rooms[roomCode] = {
			id: roomCode,
			players: [],
			started: false,
			pCount: 0,
			genre: 'pop',
			ready: [],
			answered: [],
			songIndex: 0,
			scores: {},
		};
		// console.log(roomCode)
		// console.log(rooms)
		socket.emit('roomcode', roomCode);
	});

	socket.on('join', function(room, user) {
		roomID = room;
		username = user;

		if (room in rooms && rooms[room].pCount != 8 && rooms[room].started == false) {
			socket.join(room);
			rooms[room].players.push(user);
			rooms[room].pCount += 1;
			console.log(rooms[room]);
			io.sockets.in(room).emit('userJoin', rooms[room]);
		} else {
			console.log('no room or has started already');
		}
	});

	socket.on('ready', function(user, code) {
		rooms[code].ready.push(user);
		//send message to other clients in room to update
		io.sockets.in(code).emit('ready', user);

		if (rooms[code].ready.length == rooms[code].players.length) {
			let time = 3000;
			io.sockets.in(code).emit('messageReceived', 'Game is beginning in', 'Server');

			let lobbyTimer = setInterval(() => {
				if (!(roomID in rooms)) {
					clearInterval(lobbyTimer);
				} else if (rooms[code].ready.length != rooms[code].players.length) {
					console.log(rooms[code]);
					io.sockets.in(code).emit('messageReceived', 'Timer stopped', 'Server');
					clearInterval(lobbyTimer);
				}

				//change this into a mod something
				if (time == 3000) {
					io.sockets.in(code).emit('messageReceived', '3', 'Server');
				} else if (time == 2000) {
					io.sockets.in(code).emit('messageReceived', '2', 'Server');
				} else if (time == 1000) {
					io.sockets.in(code).emit('messageReceived', '1', 'Server');
				} else if (time == 0) {
					io.sockets.in(code).emit('messageReceived', 'Go', 'Server');

					if (rooms[code].genre == 'demo1') {
						fs.readFile('demo1.json', 'utf-8', function(err, contents) {
							var playlist = JSON.parse(contents);
							console.log(playlist);
							io.sockets.in(code).emit('loadPlaylist', playlist);
							rooms[code].started = true;
						});
					} else if (rooms[code].genre == 'demo2') {
						fs.readFile('demo2.json', 'utf-8', function(err, contents) {
							var playlist = JSON.parse(contents);
							console.log(playlist);
							io.sockets.in(code).emit('loadPlaylist', playlist);
							rooms[code].started = true;
						});
					} else {
						music.getRelatedArtists(rooms[code].genre, function(returnVal) {
							music.getRelatedSongs(returnVal, function(finalPlaylist) {
								console.log(finalPlaylist);
								io.sockets.in(code).emit('loadPlaylist', finalPlaylist);
								rooms[code].started = true;
							});
						});
					}
					clearInterval(lobbyTimer);
				}
				time = time - 100;
			}, 100);
		}
	});

	socket.on('unready', function(user, code) {
		var m = rooms[code].ready.indexOf(user);

		if (m != -1) {
			rooms[code].ready.splice(m, 1);
		}
		//send message to other clients in room to update
		io.sockets.in(code).emit('unready', user);
	});

	socket.on('messageSent', function(user, code, msg) {
		//send message into chat broadcast
		io.sockets.in(code).emit('messageReceived', msg, user);
	});

	socket.on('genre', function(newGenre, code) {
		rooms[code].genre = newGenre;
		//send message that genre changed to room
		io.sockets.in(code).emit('updateGenre', rooms[code]);
	});

	socket.on('answered', function(username, value, start) {
		if (!(username in rooms[roomID].scores)) {
			rooms[roomID].scores[username] = 0;
			io.sockets.in(roomID).emit('updateGameTable', rooms[roomID]);
		} else {
			rooms[roomID].scores[username] += value;
			io.sockets.in(roomID).emit('updateGameTable', rooms[roomID]);
		}

		rooms[roomID].answered.push(username);

		console.log(rooms[roomID]);

		if (
			rooms[roomID].answered.length >= rooms[roomID].players.length &&
			rooms[roomID].started == true
		) {
			if (rooms[roomID].songIndex == 5) {
				io.sockets.in(roomID).emit('loadResultsPage', rooms[roomID]);
				let scores = rooms[roomID].scores;
				let genre = rooms[roomID].genre;
				Object.keys(scores).forEach(function(user) {
					let d = new Date();

					dformat =
						[ d.getFullYear(), d.getMonth() + 1, d.getDate() ].join('-') +
						' ' +
						[ d.getHours(), d.getMinutes(), d.getSeconds() ].join(':');
					pool.query(
						`insert into scores values ('${user}',${scores[
							user
						]}, 'multiplayer', '${genre}', '${dformat}')`
					);
				});
			} else {
				var time = 3;
				var roundCountdown = setInterval(() => {
					if (time == 0 && rooms[roomID].started == true) {
						io.sockets.in(roomID).emit('countdown', 0);
						io.sockets.in(roomID).emit('loadNextSong', rooms[roomID].songIndex);
						rooms[roomID].songIndex += 1;
						rooms[roomID].answered = [];
						clearInterval(roundCountdown);
					}
					io.sockets.in(roomID).emit('countdown', time);
					time -= 1;
				}, 1000);
			}
		}
	});

	socket.on('playagain', function() {
		rooms[roomID].started = false;
		rooms[roomID].ready = [];
		rooms[roomID].answered = [];
		rooms[roomID].songIndex = 0;
		rooms[roomID].scores = {};
		socket.emit('again');
		console.log(rooms[roomID]);
	});

	socket.on('disconnect', function() {
		if (roomID in rooms) {
			//removes user from room
			var i = rooms[roomID].players.indexOf(username);
			var j = rooms[roomID].ready.indexOf(username);
			var l = rooms[roomID].answered.indexOf(username);

			if (i != -1) {
				rooms[roomID].players.splice(i, 1);
			}
			if (j != -1) {
				rooms[roomID].ready.splice(j, 1);
			}
			if (l != -1) {
				rooms[roomID].answered.splice(j, 1);
			}

			delete rooms[roomID].scores[username];
			rooms[roomID].pCount -= 1;

			if (rooms[roomID].pCount == 0 && rooms[roomID].started == false) {
				delete rooms[roomID];
			}
			io.sockets.in(roomID).emit('updateGameTable', rooms[roomID]);

			io.sockets.in(roomID).emit('userLeave', rooms[roomID]);

			console.log(rooms);
			console.log('user disconnected');
		}
	});
});
