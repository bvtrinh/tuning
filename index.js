const express = require('express');
const path = require('path');
const { check, validationResult } = require('express-validator');
const cookieParser = require('cookie-parser');
const expressSession = require('express-session');
var Spotify = require('node-spotify-api') //newly added https://github.com/ceckenrode/node-spotify-api https://developer.spotify.com/documentation/web-api/reference/
const { getChart } = require('billboard-top-100') //https://github.com/darthbatman/billboard-top-100
var async = require("async") //https://www.npmjs.com/package/async
let fs = require('fs'); //for writing to disk for json file
var bodyparser = require('body-parser');

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

var spotify = new Spotify({
  id: 'c8d6a311fb184475bd84053aed97f3fb',
  secret: '2b8f0bc2b6cf493ba50bb93583ee4fcc',
})

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyparser.json())
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
    req.session.genre = null;
    res.render('pages/playlists');
  } else {
    res.redirect('login');
  }
});

app.get('/leaderboard', (req, res) => {
  if (req.session.username) {
    // just in case we access this straigh after a game, we reset the genre and playtype
    req.session.genre = null;
    req.session.playtype = null;
    // query here
    res.render('pages/leaderboard', { username: req.session.username,/* data would normally be obtained form the query */ data: { score: 300, username: "test", bestgenre: "pop", genrescores: 300 } });
  } else {
    res.redirect('login');
  }
});

app.get('/profile', (req, res) => {
  if (req.session.username) {
    res.render('pages/profile', { username: req.session.username });
  } else {
    res.redirect('login');
  }
});

app.get('/reset', (req, res) => {
  if (req.session.username) {
    res.render('pages/reset', { username: req.session.username, errors: null });
  } else {
    res.redirect('profile');
  }
});

app.get('/login', (req, res) => { res.render('pages/login', { errors: null }) });

app.get('/genre/:genre', (req, res) => {
  if (req.session.username) {
    req.session.genre = req.params.genre;
    var results = {
      username: req.session.username,
      title: 'game',
      genre: capitalize_words(req.session.genre)
    };

    res.render('pages/game_mc', results);
    // redirect to the play page passing req.session.genre as the genre variable
  } else {
    res.redirect('/profile');
  }
});

app.get('/playtype/:playtype', (req, res) => {
  if (req.session.username) {
    req.session.playtype = req.params.playtype;
    res.render('pages/playlists');
  } else {
    res.redirect('/profile');
  }
});

app.get('/signup', (req, res) => { res.render('pages/signup', { errors: null }) });

app.post('/reset', (req, res) => {
  var oldpassword = req.body.Currentpassword;
  var newpassword = req.body.Newpassword;
  var confirm = req.body.ConfirmNewpassword;
  var username = req.session.username;

  //hash oldpassword and compare this with password in database
  pool.query(`SELECT password FROM users WHERE username = '${username}'`, (error, results) => {
    if (error) {
      throw error;
    }
    const hash = results.rows[0].password.toString();
    bcrypt.compare(oldpassword, hash, function (err, response) {
      if (response) {
        //check to new if new passwords match
        if (newpassword == confirm) {
          //hash new password and update db with new passwords
          bcrypt.hash(newpassword, saltRounds, (err, hash) => {
            pool.query(`UPDATE users SET password = '${hash}' WHERE username = '${username}'`);
          });
          res.redirect('play');
        }
        else {
          res.render('pages/reset', { username: req.session.username, errors: [{ msg: 'Passwords do not match' }] });
        }
      }
      else {
        res.render('pages/reset', { username: req.session.username, errors: [{ msg: 'Incorrect password' }] });
      }
    });
  });
});

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

    if (results.rows.length == 0) {
      res.render('pages/login', { errors: [{ msg: 'Incorrect username and/or password' }] });
    }
    else {
      const hash = results.rows[0].password.toString();
      bcrypt.compare(password, hash, function (err, response) {
        if (response) {
          req.session.username = username;
          res.redirect('play');
        }
        else {
          res.render('pages/login', { errors: [{ msg: 'Incorrect username and/or password' }] });
        }
      });
    }
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

    if (results.rows.length != 0) {
      res.render('pages/signup', { errors: [{ msg: 'Username is already in use' }] });
    }
    else {

      var errors = validationResult(req);
      if (!(password === confirmPassword)) {
        res.render('pages/signup', { errors: [{ msg: 'Passwords do not match' }] });
      }
      else if (!errors.isEmpty()) {
        res.render('pages/signup', errors)
      }
      else {
        bcrypt.hash(password, saltRounds, (err, hash) => {

          pool.query(`INSERT INTO users (username, password) VALUES ('${username}', '${hash}')`, (error) => {
            if (error) {
              throw error;
            }
          });

        });

        req.session.username = username;
        res.redirect('play');
      }
    }
  });
});

app.get('/play', (req, res) => {
  if (req.session.username) {
    req.session.playtype = null;
    req.session.genre = null;
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

app.post('/playlist', (req, res) => {

  getRelatedArtists(req.session.genre, function (returnVal) {
    getRelatedSongs(returnVal, function (finalPlaylist) {
      console.log(finalPlaylist)
      res.send(finalPlaylist);
    })
  })
});

app.post('/upScore', (req, res) => {

  let username = req.session.username
  let score = req.body.userScore
  let genre = req.session.genre
  let gamemode = req.session.playtype
  let d = new Date()

  //format date properly
  dformat = [d.getFullYear(), d.getMonth() + 1, d.getDate()].join('-')
    + ' ' + [d.getHours(),
    d.getMinutes(),
    d.getSeconds()].join(':');


  pool.query(`INSERT INTO scores values ('${username}',${score}, '${gamemode}', '${genre}', '${dformat}')`, function (err, res) {
    if (err) {
      return console.log(err)
    }

  })
})

app.get('*', function (req, res) {
  res.status(404).send('ERROR 404: The page you requested is invalid or is missing, please try something else')
});



app.listen(PORT, () => console.log(`Listening on ${PORT}`));

//10 days we update the database
console.log("------STARTING SONG DATABASE UPDATE------")
updateSongDB()
setInterval(alertUpdate, 10 * 24 * 60 * 60 * 1000 - 20)
setInterval(updateSongDB, 10 * 24 * 60 * 60 * 1000)

//capitalize_Words 
function capitalize_words(str) {
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

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

    //console.log(uniqueArtists)
    //console.log("----------------------------")
    //Used to limit our web api calls to 1 parallel connection at a time

    async.eachLimit(uniqueArtists, 5, function (artist, callback) {
      setTimeout(function () {
        spotify.search({ type: 'artist', query: artist }, function (err, data) {
          if (err) {
            return console.log('Error occurred: ' + err);
          }

          //we use index 0, because that is the most popular artists -> the artist we queried
          let artistId = data.artists.items[0].id
          let artistGenres = {}
          for (let n = 0; n < data.artists.items[0].genres.length; n++) {
            artistGenres[data.artists.items[0].genres[n]] = 1
          }
          let artistName = artist.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;"); //escape special characters
          spotify.request(`https://api.spotify.com/v1/artists/${artistId}/top-tracks?country=CA`, function (err, data) {
            if (err) {
              return console.log("this is the error for top tracks query : " + err)
            }

            let hasPreviews = []

            //put genre into a json format
            for (let i = 0; i < data.tracks.length; i++) {
              if (data.tracks[i].preview_url != null) {
                hasPreviews.push(data.tracks[i])
              }
            }

            if (hasPreviews.length == 0) {
              return console.log("No songs available for: " + artistName)
            }

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
}

function alertUpdate() {
  return console.log("------STARTING SONG DATABASE UPDATE------")
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


// *************************** PLAYLIST PAGE **********************************
/*
Purpose: Create a playlist of 5 (tbd) songs based on selected genre and grab 3 randomly selected related artists and insert it into the playlist
Params: genre -> the selected genre
Return: return the updated playlist with related artists
*/
function getRelatedArtists(genre, callback) {
  pool.query(`select * from songs s where (s.genre -> '${genre}') is not null order by random() limit 5`, function (err, result) {
    if (err) {
      return console.log(err)
    }

    var returnPlaylist = JSON.parse(JSON.stringify(result.rows))

    let artistsId = []

    for (let i = 0; i < result.rowCount; i++) {
      artistsId.push(result.rows[i].artistid)
    }
    let counter = 0;

    async.eachLimit(artistsId, 1, function (artist, callback) {
      counter += 1
      let relatedArtists = []
      spotify.request(`https://api.spotify.com/v1/artists/${artist}/related-artists`, function (err, res) {
        if (err) {
          return console.log(err)
        }

        let relatedArtistsPool = []

        // related artists names
        for (let j = 0; j < res.artists.length; j++) {
          relatedArtistsPool.push(res.artists[j].name)
        }

        // select 3 random related artists
        for (let k = 0; k < 3; k++) {
          relatedArtists.push(relatedArtistsPool.splice(Math.random() * (relatedArtistsPool.length - 1), 1).pop())
        }
        //add new key value pair to its respective location in the playlist
        returnPlaylist[counter - 1].related_artists = relatedArtists
        callback()
      })
    },
      function (err) {
        callback(returnPlaylist)
      })

  })
}

/*
Purpose: grab 3 randomly selected related songs based off of related artists to be used as wrong answers and insert it into the playlist
Params: relatedArtists -> related artists of selected artist in playlist
Return: return the updated playlist with related songs
*/
function getRelatedSongs(playlist, callback) {
  let returnPlaylist = JSON.parse(JSON.stringify(playlist))

  let artistId = []

  for (let i = 0; i < returnPlaylist.length; i++) {
    artistId.push(returnPlaylist[i].artistid)
  }

  let counter = 0

  async.eachLimit(artistId, 1, function (artist, callback) {
    counter += 1
    let relatedSongs = []

    spotify.request(`https://api.spotify.com/v1/artists/${artist}/top-tracks?country=CA`, function (err, res) {
      if (err) {
        return console.log(err);
      }

      // store top tracks names into pool (array)
      let relatedSongsPool = []

      for (let j = 0; j < res.tracks.length; j++) {
        relatedSongsPool.push({ name: res.tracks[j].name, id: res.tracks[j].id });
      }

      relatedSongsPool = relatedSongsPool.filter(function (song) {
        return song.id != returnPlaylist[counter-1].songid
      })

      // randomly select 3 of those top tracks
      for (let i = 0; i < 3; i++) {
        randomRelatedSong = relatedSongsPool.splice(Math.random() * relatedSongsPool.length - 1, 1).pop()
        relatedSongs.push(randomRelatedSong.name)
      }

      // place related songs into playlist to return
      returnPlaylist[counter-1].related_songs = relatedSongs;
      callback()
    })
  },
    function (err) {
      callback(returnPlaylist)
    })
}
