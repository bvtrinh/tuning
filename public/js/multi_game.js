$(document).ready(function() {
    console.log(roomCode, type, user)
       
    //updates the room info when user joins
    socket.on('userJoin', function (room) {
        let players = room.players
        let pCount = room.pCount
        let roomGenre = room.genre

        $("#roomCode").html(`Room code: <br>${roomCode}`)

        $("#players").empty();
        for (let i = 0; i < players.length; i++) {
            updatePlayerTable(players[i], room)
        }

        $(".numPlayers").html(`${pCount}/8 Players`)

        $('.genre').val(roomGenre)
    })

    //updates the room info when user leaves
    socket.on('userLeave', function (room) {
        let players = room.players
        let pCount = room.pCount
        let roomGenre = room.genre
        $("#players").empty();
        for (let i = 0; i < players.length; i++) {
            updatePlayerTable(players[i], room)
        }

        $(".numPlayers").html(`${pCount}/8 Players`)

        $('.genre').val(roomGenre)
    })

    function updatePlayerTable(username, room) {
        let state = "Unready"
        if (room.ready.includes(username)) {
            state = "Ready"
        }
        $("#players").append(`<tr class="${username}"><td class='name'>${username}</td><td class="state">${state}</td></tr>`)
    }

    $(document).ready(function () {
        $("#readyState").click(function () {
            if ($(`.${user} > .state`).html() == "Unready") {
                socket.emit('ready', user, roomCode)
            }
            else {
                socket.emit('unready', user, roomCode)
            }
        })
    })

    socket.on('ready', function (user) {
        $(`.${user} > .state`).html("Ready")
    })

    socket.on('unready', function (user) {
        $(`.${user} > .state`).html("Unready")
    })

    $(function () {
        $('#genre').on('change', function () {
            let newGenre = $('option:selected').val()
            socket.emit('genre', newGenre, roomCode)
        })
    })

    socket.on('updateGenre', function (room) {
        let roomGenre = room.genre
        $('.genre').val(roomGenre)
    })

    $(document).ready(function () {
        $(".messageSend").click(function () {
            if($(".messageInput").val().trim() != "") { // if statement to prevent "empty" messages from sending
                var msg = $(".messageInput").val();

                // auto scrolling chat box
                var height = 0;
                $(".history p").each(function(i, value){
                height += parseInt($(this).height());
                });
                height += '';
                $(".history").animate({scrollTop: height});

                socket.emit('messageSent', user, roomCode, msg)
                $(".messageInput").val("")
            }
        })
    })

    // func to submit message on enter keypress
    $(document).ready(function() {
        $(".messageInput").keypress(function(e) {
            if(e.which == 13 && $(".messageInput").val().trim() != "") {
                var msg = $(".messageInput").val();

                // auto scrolling chat box
                var height = 0;
                $(".history p").each(function(i, value){
                height += parseInt($(this).height());
                });
                height += '';
                $(".history").animate({scrollTop: height});

                socket.emit('messageSent', user, roomCode, msg)
                $(".messageInput").val("")

                e.preventDefault();
            }
        })
    })

    socket.on('messageReceived', function (msg, user) {
        $(".history").append($(`<p>${user}: ${msg}</p>`))
    })

    socket.on('loadPlaylist', function (loadPlaylist) {
        playlist = loadPlaylist
        $("#lobby").hide()
        $('#results').hide()
        $("#game").show()

        // Disable the button so user's don't accidentally submit before song is loaded
        $(".mc").attr('disabled', true);

        socket.emit('answered', user, 0)
    })

    socket.on('countdown', function (time) {
        //hide buttons
        $(document).ready(function () {
            $("#audio-playback").trigger("pause");
        })
        if (time == 0) {
            $("#countdown").html("GO!");
            $('#countdown').delay(1000).fadeOut(500);
            // Set the initial volume
            $("#audio-playback").prop("volume", 0.1);
            $("#audio-playback").trigger("load");
            $("#audio-playback").trigger("play");
            $(".mc").attr('disabled', false);
        }
        else {
            //display countdown
            $("#countdown").fadeIn(500);
            $("#countdown").html(time);
        }

    })

    socket.on('loadNextSong', function (index) {
        currSong = playlist[index]
        update_song_view(currSong, index);
    })

    // Check if the user has guessed correctly
    function mark_guess(song_guess, correct_song, guess_id) {

        // There are escaped HTML characters in the string for "'"
        correct_song = correct_song.replace("&#039;", "'");

        if (song_guess == correct_song) {
            $("#progressbar").css("width", 100 + "%").attr("aria-valuenow", 100);
            let score = parseInt(1000 * (percent / 100))
            socket.emit('answered', user, score)
        }
        else {
            chg_btn_color(guess_id, 'red');
            socket.emit('answered', user, 0)

        }

        chg_btn_color(get_btn_i(correct_song), 'green');
        // This is hides the alert after a set amount of time 
        $(".alert").fadeTo(3000, 500).slideUp(500, function () {
            $(".alert").slideUp(500);
        });

        $(".mc").attr('disabled', true);
    }

    function chg_btn_color(id, color) {
        $('#btn' + id).css("background", color);
    }

    function get_btn_i(song) {
        var val;
        song = song.replace("&#039;", "'");
        for (var i = 0; i < 4; i++) {
            val = $('#btn' + i).html();
            if (val == song) {
                return i;
            }
        }
    }

    socket.on('updateGameTable', function (room) {
        var answered = room.scores //{username -> score}
        // https://stackoverflow.com/questions/25500316/sort-a-dictionary-by-value-in-javascript
        console.log(answered)
        // Create array from dictionary
        var items = Object.keys(answered).map(function (key) {
            return [key, answered[key]];
        });

        // Sort the array based on the second element
        items.sort(function (first, second) {
            return second[1] - first[1];
        });

        // Clear the body of the table
        $("#scoreboard > tbody").empty()

        // Instead reformat table here
        items.forEach(function (item) {
            var row = `<tr> <td>${item[0]}</td> <td>${item[1]}</td> </tr>`;
            $("#scoreboard > tbody").append(row);
        });
    });



    $(document).ready(function () {
        $("#audio-playback").on("playing", function () {
            percent = 100
            var progress = setInterval(function () {
                var audio = document.getElementById("audio-playback");
                var duration = audio.duration;
                var curr_time = audio.currentTime;
                percent = (duration - curr_time) / duration * 100

                $("#progressbar").css("width", percent + "%").attr("aria-valuenow", percent);

                if (curr_time > duration || audio.paused) {
                    $("#progressbar").css("width", 100 + "%").attr("aria-valuenow", 100);
                    clearInterval(progress);

                }
            }, 100);

        });
    })
    $(document).ready(function () {
        $("#audio-playback").on("ended", function () {
            chg_btn_color(get_btn_i(currSong.songname), 'green');
            // Hide the alert after a 3s 
            $(".alert").fadeTo(3000, 500).slideUp(500, function () {
                $(".alert").slideUp(500);
            });

            // Go to the next song in the playlist
            socket.emit('answered', user, 0)
        });
    })

    $(document).ready(function () {
        $(".mc").click(function () {
            var guess = $(this).html();
            var guess_id = $(this).attr("id").slice(3, 4);
            //$("#audio-playback").trigger("pause");

            // Validate the guess against the correct answer using the innerHTML of the buttons
            mark_guess(guess, currSong.songname, guess_id);
        });
    })

    socket.on('loadResultsPage', function (room) {
        $(document).ready(function () {
            $("#audio-playback").trigger("pause");
        })

        room.players.forEach(function(user){
            $(`.${user} > .state`).html("Unready")
        })

        //POSTS PLAYERLIST AT END
        var answered = room.scores //{username -> score}
        // https://stackoverflow.com/questions/25500316/sort-a-dictionary-by-value-in-javascript
        // Create array from dictionary
        var items = Object.keys(answered).map(function (key) {
            return [key, answered[key]];
        });

        // Sort the array based on the second element
        items.sort(function (first, second) {
            return second[1] - first[1];
        });

        // Clear the body of the table
        $("#resultsPlayers").empty()

        // Instead reformat table here
        items.forEach(function (item) {
            console.log(item)
            var row = `<tr> <td>${item[0]}</td> <td>${item[1]}</td> </tr>`;
            console.log(row)
            $("#resultsPlayers").append(row);
        });

        let songNum = 1
        $("#resultsSongs").empty()

        playlist.forEach(function(song){
            var row = `<tr> <td>${songNum}</td> <td>${song.songname}</td> <td>${song.artistname}</td> </tr>`;
            $("#resultsSongs").append(row)
            songNum += 1
        })
        
        $('#game').hide()
        $('#results').show()
    })

    $(document).ready(function () {
        $("#playagain").click(function () {
            socket.emit("playagain")
        })
    })

    socket.on('again', function(){
        $('#results').hide()
        $("#lobby").show()
    })
    
    function update_song_view(song, i) {
        $("#song_counter").html(parseFloat(i + 1) + "/5");
        $("#song-playback").attr("src", song.url);
        var btn_nums = [0, 1, 2, 3];
        btn_nums = shuffle(btn_nums);
        var correct_btn = btn_nums.pop()
        $("#btn" + correct_btn).html(song.songname);
        $("#btn" + correct_btn).css("background", "#23272b");
        var id_num;

        for (var i = 0; i < 3; i++) {
            id_num = btn_nums.pop();
            $("#btn" + id_num).html(song.related_songs[i]);
            $("#btn" + id_num).css("background", "#23272b");
        }
    }

    function shuffle(arr) {

        const len = arr.length;
        var temp;
        var rand_int;
        for (var i = 0; i < len; i++) {
            rand_int = Math.floor(Math.random() * (len - i)) + i
            temp = arr[i];
            arr[i] = arr[rand_int];
            arr[rand_int] = temp;
        }
        return arr;
    }
});