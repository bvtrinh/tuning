var percent
$(document).ready(function () {

    // Set the initial volume
    $("#audio-playback").prop("volume", 0.5);
    $("#score").html("Score: 0");

    // Should hide this div with css
    $("#result-btns").hide();

    // Get the playlist object from the server
    $.ajax({
        url: "/playlist",
        method: "POST",
        dataType: "JSON",
        success: function(data) {
            console.log(data);
            gameplay(data, score);
        },
        error: function(err) {
            console.log(err)
        },
    });

    // Functionality of gameplay
    function gameplay(playlist) {
        var num_songs = playlist.length;
        var curr_song = 0;

        // Disable the button so user's don't accidentally submit before song is loaded
        $(".btn").attr('disabled', true);

        countdown_timer();

        // Update the song url and what current song the user is on
        update_song_view(playlist[curr_song], curr_song, num_songs);

        // The case where the user doesn't submit any answers before the preview ends
        $("#audio-playback").on("ended", function() {

            $('#guess-feedback').html("<div class=\"alert alert-danger\" \
            role=\"alert\"> <button type=\"button\" class=\"close\" data-dismiss=\"alert\">x \
            </button> <strong>You ran out of time :(</strong></div>").fadeIn(300);

            // Hide the alert after a 3s 
            $(".alert").fadeTo(3000, 500).slideUp(500, function(){
                $(".alert").slideUp(500);
            });

            // Go to the next song in the playlist
            curr_song++;
            next_song(playlist[curr_song], curr_song, num_songs)
        });

        // A user submits an answer, the answer is marked and the user is alerted accordingly
        $(".btn").click(function() {
            var guess_ans = $(this).html();

            $("#audio-playback").trigger("pause");

            // For now the current answer can be the song name or artist
            mark_guess(guess_ans, playlist[curr_song].songname);

            // Go to the next song in the playlist
            curr_song++;
            next_song(playlist[curr_song], curr_song, num_songs)

        });

        // Update the progress bar visually to match the current time of the song
        $("#audio-playback").on("playing", function() {
            percent = 100
            var progress = setInterval(function() {
                var audio = document.getElementById("audio-playback");
                var duration = audio.duration;
                var curr_time = audio.currentTime;
                percent = (duration - curr_time)/duration * 100

                $("#progressbar").css("width", percent + "%").attr( "aria-valuenow", percent);

                if (curr_time > duration || audio.paused) {
                    $("#progressbar").css("width", 100 + "%").attr( "aria-valuenow", 100);
                    clearInterval(progress);

                }
            },100);
            
        });
    }

    // Displays a countdown timer in between songs
    function countdown_timer() {

        // Number of seconds in between songs
        var time2play = 3;
        var countdown = setInterval(function() {
            $("#countdown").fadeIn(500);
            $("#countdown").html(time2play);
            time2play--;

            if (time2play < 0) {
                clearInterval(countdown);
                $("#countdown").html("GO!");
                $('#countdown').delay(1000).fadeOut(500);
                $("#audio-playback").trigger("load");
                $("#audio-playback").trigger("play");
                $(".btn").attr('disabled', false);
                $("#countdown").html("&nbsp;");
            }
        },1000);

    }

    function shuffle(arr) {

        const len = arr.length;
        var temp;
        var rand_int;
        for (var i=0; i < len; i++) {
            rand_int = Math.floor(Math.random() * (len-i)) + i
            temp = arr[i];
            arr[i] = arr[rand_int];
            arr[rand_int] = temp;
        }
        return arr;
    }

    // Updates the song url and current song number
    function update_song_view(song, i, num_songs) {
        $("#song_counter").html(parseFloat(i + 1) + "/" + num_songs);
        $("#song-playback").attr("src", song.url);
        var songs = song.related_songs;
        songs.push(song.songname);
        songs = shuffle(songs);

        for (var i=0; i < 4; i++) {
            $("#btn"+i).html(songs[i]);
        }
    }

    // Load the next song in the playlist
    function next_song(song, curr_song, num_songs, score) {

        // Disable buttons to prevent accidental submissions
        $(".btn").attr('disabled', true);

        // Check if the last song in the playlist has played
        if (is_finished(curr_song, num_songs)) {
            var score = $("#score").html();
            score = parseFloat(score.slice(6, score.length));
            // Show the final score and button to redirect to other pages
            upload_score(score)
            show_results(score);

        }
        else {
            // Songs still remaining
            countdown_timer();
            update_song_view(song, curr_song, num_songs);
        }

    }

    // Check if the user has guessed correctly
    function mark_guess(guess, songname) {
        if (guess == songname) {
            $("#progressbar").css("width", 100 + "%").attr( "aria-valuenow", 100);
            $('#guess-feedback').html("<div class=\"alert alert-success\" \
            role=\"alert\"> <button type=\"button\" class=\"close\" data-dismiss=\"alert\">x \
            </button> <strong>You got it right!</strong></div>").fadeIn(300);
            var score = $("#score").html();
            score = parseFloat(score.slice(6, score.length));
            score = score + parseInt(1000*(percent/100))
            $("#score").html("Score: " + score);
        }
        else {
            $('#guess-feedback').html("<div id=\"alert\" class=\"alert alert-danger\" \
            role=\"alert\"> <button type=\"button\" class=\"close\" data-dismiss=\"alert\">x \
            </button> <strong>That's incorrect...</strong></div>").fadeIn(300);
        }

        // This is hides the alert after a set amount of time 
        $(".alert").fadeTo(3000, 500).slideUp(500, function(){
            $(".alert").slideUp(500);
        });

    }

    // Check if its the last song in the playlist
    function is_finished(curr_song, num_songs) {
        return (curr_song >= num_songs) ? true : false;
    }

    // Hide the input and progress divs and show the redirect buttons
    function show_results() {
        $('#mc_btns').hide();
        $('#progress-box').hide();
        $('#result-btns').show();
        $('#page-title').html('Results').hide().fadeIn(500);
    }

    function upload_score(score){

        $.ajax({
            url: "/upScore",
            method: "POST",
            data: {userScore: score},
            dataType: "application/json",
            success: function() {
                console.log("success")
            },
            error: function(err) {
                console.log(err)
            },
        });
    }
});