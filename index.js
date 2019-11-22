const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const expressSession = require('express-session');
const bodyparser = require('body-parser');
const users = require('./routes/users');
const gameplay = require('./routes/play');
const music = require('./scripts/music')
const PORT = process.env.PORT || 5001
const app = express();

// Load environment variables
// Need this for testing
require('dotenv').config();

// Configuration settings
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyparser.json())
app.use(expressSession({ secret: process.env.SESSION_SECRET, saveUninitialized: false, resave: false }));
app.use(cookieParser());
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  if (req.session.username) {
    res.redirect('play');
  }
  else {
    res.render('pages/index');
  }
});

// Routers
app.use('/users', users);
app.use('/play', gameplay);

app.get('*', function (req, res) {
  res.status(404).send('ERROR 404: The page you requested is invalid or is missing, please try something else');
});

app.listen(PORT, () => console.log(`Listening on ${PORT}`));

module.exports = app;

console.log("Loading " + process.env.NODE_ENV + " environment...");
//10 days we update the database
if (process.env.NODE_ENV == 'production') {
    console.log("------STARTING SONG DATABASE UPDATE------");
    music.updateSongDB();
    setTimeout(function(){
    music.updateSongDBSpecific('2016-08-27')
    }, 30000);

    setTimeout(function(){
    music.updateSongDBSpecific('2013-08-27')
    }, 60000);

    setTimeout(function(){
    music.updateSongDBSpecific('2010-08-27')
    }, 90000);

    setTimeout(function(){
    music.updateSongDBSpecific('2007-08-27')
    }, 120000);

    setTimeout(function(){
    music.updateSongDBSpecific('2004-08-27')
    }, 150000);

    setInterval(music.alertUpdate, 10 * 24 * 60 * 60 * 1000 - 20);
    setInterval(music.updateSongDB, 10 * 24 * 60 * 60 * 1000);
}
