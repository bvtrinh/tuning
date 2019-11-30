const { getChart } = require('billboard-top-100') //https://github.com/darthbatman/billboard-top-100
const Spotify = require('node-spotify-api') //newly added https://github.com/ceckenrode/node-spotify-api https://developer.spotify.com/documentation/web-api/reference/
const async = require("async") //https://www.npmjs.com/package/async
const pool = require('../db/connection');

const spotify = new Spotify({
  id: process.env.SPOTIFY_ID,
  secret: process.env.SPOTIFY_SECRET
});

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
    return (artists.includes("Lil Nas X") == false);
}

module.exports = {

    updateSongDB: function() {
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
      },

      updateSongDBSpecific:function(year) {
        //Grabs all unique artists for top 100 songs
        getChart('hot-100', year, function (err, chart) {
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
      },
      
      alertUpdate: function() {
        return console.log("------STARTING SONG DATABASE UPDATE------")
      },
      
      
      // *************************** PLAYLIST PAGE **********************************
      /*
      Purpose: Create a playlist of 5 (tbd) songs based on selected genre and grab 3 randomly selected related artists and insert it into the playlist
      Params: genre -> the selected genre
      Return: return the updated playlist with related artists
      */
      getRelatedArtists: function(genre, callback) {
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
      },
      
      /*
      Purpose: grab 3 randomly selected related songs based off of related artists to be used as wrong answers and insert it into the playlist
      Params: relatedArtists -> related artists of selected artist in playlist
      Return: return the updated playlist with related songs
      */
      getRelatedSongs: function(playlist, callback) {
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
              return ((song.id != returnPlaylist[counter-1].songid) && !(song.name.includes(returnPlaylist[counter-1].songname)))
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
}