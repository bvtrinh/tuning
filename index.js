const express = require('express');
const path = require('path');
const { check, validationResult } = require('express-validator');
const cookieParser = require('cookie-parser');
const expressSession = require('express-session');
var Spotify = require('node-spotify-api') //newly added https://github.com/ceckenrode/node-spotify-api https://developer.spotify.com/documentation/web-api/reference/
const { getChart } = require('billboard-top-100') //https://github.com/darthbatman/billboard-top-100
var async = require("async") //https://www.npmjs.com/package/async

const PORT = process.env.PORT || 5000

var app = express();

var bcrypt = require('bcrypt');
const saltRounds = 10;
// const db = require('./db');
// for when we create database
const { Pool } = require('pg');
var pool;
pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  //ssl: true
});

//newly added
var spotify = new Spotify({
  id: 'c8d6a311fb184475bd84053aed97f3fb',
  secret: '2b8f0bc2b6cf493ba50bb93583ee4fcc',
})


app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(expressSession({ secret: 'tuning', saveUninitialized: false, resave: false }));
app.use(cookieParser());
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  if (req.session.username) {
    res.redirect('play');
  }
  else {
    res.render('pages/index', { title: 'home' });
  }
});

app.get('/playlists', (req, res) => {
  if (req.session.username) {
    res.render('pages/playlists');
  } else {
    res.redirect('login');
  }
});

app.get('/profile', (req, res) => {
  if (req.session.username) {
    res.render('pages/profile');
  } else {
    res.redirect('login');
  }
});

app.get('/login', (req, res) => { res.render('pages/login', { errors: null }) });

app.get('/signup', (req, res) => { res.render('pages/signup', { errors: null }) });

app.post('/sign_in', (req, res) => {
  var username = req.body.username;
  var password = req.body.password;
  var errors = null;
  // hash
  // validate on db
  pool.query(`SELECT password FROM users WHERE username = '${username}'`, (error, results) => {
    if (error) {
      throw error;
    }

    if (results.length == 0) {
      res.render('pages/login', { errors: [{ msg: 'Incorrect username and/or password' }] });

    }

    const hash = results.rows[0].password.toString();

    bcrypt.compare(password, hash, function (err, response) {
      if (response == true) {
        req.session.username = username;
        res.redirect('play');
      }
      else {
        res.render('pages/login', { errors: [{ msg: 'Incorrect username and/or password' }] });
      }
    });

  });
});

app.post('/sign_up', [check('password', 'password is too short').isLength({ min: 5 }), check('username', 'username is too short').isLength({ min: 5 })], (req, res) => {
  var username = req.body.username;
  var password = req.body.password;
  var confirmPassword = req.body.confirmPassword;
  pool.query(`SELECT * FROM users WHERE username = '${username}'`, (error, results) => {
    if (error) {
      throw error;
    }

    if (results.length != 0) {
      res.render('pages/signup', { errors: [{ msg: 'username is already in use' }] });
    }
  });
  //  else
  var errors = validationResult(req);
  if (!(req.body.password === req.body.confirmPassword)) {
    res.render('pages/signup', { errors: [{ msg: 'Passwords do not match' }] });
  }
  else if (!errors.isEmpty()) {
    res.render('pages/signup', errors)
  } else {
    //    hash
    //    insert into database values (username, password)
    //    dont know db name yet, so swap out users with db name
    bcrypt.hash(password, saltRounds, function (err, hash) {

      pool.query(`INSERT INTO users (username, password) VALUES ('${username}', '${hash}')`, (error) => {
        if (error) {
          throw error;
        }
      });

    });

    req.session.username = username;
    res.redirect('play');
  }
});

app.get('/play', (req, res) => {
  if (req.session.username) {
    res.render('pages/landing', { username: req.session.username, title: 'play' });
  } else {
    res.redirect('login');
  }
});

app.get('/logout', (req, res) => {
  if (req.session.username) {
    req.session.destroy((err) => { });
    res.redirect('/');
  } else {
    res.redirect('login');
  }
});

app.get('/test', function (req, res) {
  updateSongDB()
})

app.get('*', function (req, res) {
  res.status(404).send('ERROR 404: The page you requested is invalid or is missing, please try something else')
})


app.listen(PORT, () => console.log(`Listening on ${PORT}`));


//10 days we update the database
setTimeout(function(){
  console.log("------STARTING SONG DATABASE UPDATE------")
  updateSongDB()
}, 10 * 24 * 60 * 60 * 1000)





function updateSongDB() {
  //Grabs all unique artists for top 100 songs
  getChart('hot-100', function (err, chart) {
    if (err) {
      console.log(err)
      return
    }
    let topArtist = []

    //grabs all the artists for top 100 songs 
    for (let i = 0; i < chart.songs.length; i++) {
      topArtist.push(chart.songs[i].artist)
    }

    topArtist = topArtist.filter(removeLilNasX)
    //Regex for seperating Artists from a song, like if a song features another artists
    let re = /[&,+]|\bFeaturing\b|\b X \b/g

    let seperatedArtists = []

    for (let i = 0; i < topArtist.length; i++) {
      seperatedArtists = seperatedArtists.concat(topArtist[i].split(re))
    }

    //Cleaning up spaces at end and beginning of an artist name string
    for (let i = 0; i < seperatedArtists.length; i++) {
      seperatedArtists[i] = seperatedArtists[i].trim()
    }

    //Grab all the unique artists
    let uniqueArtists = seperatedArtists.filter(onlyUnique)

    //Used to limit our web api calls to 1 parallel connection at a time
    async.eachLimit(uniqueArtists, 5, function (artist, callback) {
      setTimeout(function () {
        spotify.search({ type: 'artist', query: artist }, function (err, data) {
          if (err) {
            return console.log('Error occurred: ' + err);
          }

          //we use index 0, because that is the most popular artists -> the artist we queried
          let artistId = data.artists.items[0].id
          let artistGenres = data.artists.items[0].genres
          let artistName = artist.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;"); //escape special characters
          spotify.request(`https://api.spotify.com/v1/artists/${artistId}/top-tracks?country=CA`, function (err, data) {
            if (err) {
              return console.log(err)
            }

            let hasPreviews = []

            for (let i = 0; i < data.tracks.length; i++) {
              if (data.tracks[i].preview_url != null) {
                hasPreviews.push(data.tracks[i])
              }
            }

            if (hasPreviews.length == 0) {
              return console.log("No songs available for: " + artistName)
            }
            /* 
                        for (let i = 0; i < hasPreviews.length; i++) {
                          console.log("=========================================")
                          console.log("artists ID: " + artistId)
                          console.log("Artists Name: " + artistName)
                          console.log("Song ID " + hasPreviews[i].id)
                          console.log("Song Name " + hasPreviews[i].name)
                          console.log("Genres " + artistGenres)
                          console.log("URL: " + hasPreviews[i].preview_url)
                          console.log("=========================================")
                        } 
            */
            //escape all special characters in song name, so we can insert into db
            for (let i = 0; i < hasPreviews.length; i++) {
              hasPreviews[i].name = hasPreviews[i].name.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
            }

            for (let i = 0; i < hasPreviews.length; i++) {
              pool.query(`select * from songs where songid = '${hasPreviews[i].id}'`, function (err, res) {
                if (err) {
                  return console.log(err)
                }

                if (res.rowCount == 0) {
                  pool.query(`INSERT INTO songs values('${artistId}', '${artistName}', '${hasPreviews[i].id}', '${hasPreviews[i].name}', '${JSON.stringify(artistGenres)}', '${hasPreviews[i].preview_url}')`, function (err, res) {
                    if (err) {
                      console.log("=========================================")
                      console.log("artists ID: " + artistId)
                      console.log("Artists Name: " + artistName)
                      console.log("Song ID " + hasPreviews[i].id)
                      console.log("Song Name " + hasPreviews[i].name)
                      console.log("Genres " + artistGenres)
                      console.log("URL: " + hasPreviews[i].preview_url)
                      console.log("=========================================")
                      return console.log(err)
                    }
                    console.log("OK")
                  })
                }
              })

            }
          })
        });
        console.log("Done upload artist: " + artist)
        callback()
      }, 3000)

    },
      function (err) {
        return console.log(err)
      })
  })
  return
}

function alertUploadDone() {
  return console.log("--------DONE UPDATING DATABASE--------")
}

//Used with .filter function to grab only unique artists in an array
function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}

//Not hating on Lil Nas X
//Literally the X part of Lil Nas X messes up the updating of the song database
//because when we use grab the artists from the top-songs of the month, it returns 
//all artist that participated in a track. For example, Kygo X Whitney Houston,
//Our regex then splits up Kygo and Whitney Houston by detecting the X, but since Lil
//Nas X has an X it splits Lil Nas X => [Lil Nas, ''], so now when we iterate through our list
//'' messes up when we query all the an artist's top tracks
function removeLilNasX(artists) {
  return (artists.includes("Lil Nas X") == false)
}
