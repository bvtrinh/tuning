$(document).ready(function () {

    // Set the initial volume
    $("#audio-playback").prop("volume", 0.5);
    $("#score").html("Score: 0");

    // Should hide this div with css
    $("#result-btns").hide();

    // Enable enter key to submit answer
    $("#guess").on("keyup", function(event) {
        // Number 13 is the "Enter" key on the keyboard
        if (event.keyCode === 13) {
            // Cancel the default action, if needed
            event.preventDefault();
            // Trigger the button element with a click
            document.getElementById("guess-ans").click();
        }
    });



    // Get the playlist object from the server
    $.ajax({
        url: "/playlist",
        method: "POST",
        dataType: "JSON",
        success: function(data) {
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
        $('#guess-ans').attr('disabled', true);
        countdown_timer();
        // Update the song url and what current song the user is on
        update_song_view(playlist[curr_song], curr_song, num_songs);

        // The case where the user doesn't submit any answers before the preview ends
        $("#audio-playback").on("ended", function() {

            $('#guess-feedback').html("<div class=\"alert alert-danger\" \
            role=\"alert\"> <button type=\"button\" class=\"close\" data-dismiss=\"alert\">x \
            </button> <strong>You ran out of time :(</strong></div>").fadeIn(300);

            // Go to the next song in the playlist
            curr_song++;
            next_song(playlist[curr_song], curr_song, num_songs)
        });

        // A user submits an answer, the answer is marked and the user is alerted accordingly
        $("#guess-ans").click(function() {
            var guess_ans = $("#guess").val();
            $("#audio-playback").trigger("pause");

            // For now the current answer can be the song name or artist
            mark_guess(guess_ans.toLowerCase(), playlist[curr_song].artistname.toLowerCase(), 
                playlist[curr_song].songname.toLowerCase());

            // Go to the next song in the playlist
            curr_song++;
            next_song(playlist[curr_song], curr_song, num_songs)

        });

        // This is suppose to hide the alert after a set amount of time but it isn't working
        $(".alert").fadeTo(2000, 500).slideUp(500, function(){
            $(".alert").slideUp(500);
        });

        // Update the progress bar visually to match the current time of the song
        $("#audio-playback").on("playing", function() {
            var progress = setInterval(function() {
                var audio = document.getElementById("audio-playback");
                var duration = audio.duration;
                var curr_time = audio.currentTime;
                var incr = 10 / duration;
                var percent = Math.min(incr * curr_time * 10, 100);
                $("#progressbar").css("width", percent + "%");

                if (curr_time >= duration && audio.paused) {
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
            $('#countdown').fadeIn(500);
            var timer = document.getElementById('countdown');
            timer.innerHTML = time2play;
            time2play--;

            if (time2play < 0) {
                clearInterval(countdown);
                timer.innerHTML = 'GO!';
                $('#countdown').delay(1000).fadeOut(500);
                $("#audio-playback").trigger("load");
                $("#audio-playback").trigger("play");
                $('#guess-ans').attr('disabled', false);
            }
        },1000);

    }

    // Updates the song url and current song number
    function update_song_view(song, i, num_songs) {
        $("#song_counter").html(parseFloat(i + 1) + "/" + num_songs);
        $("#song-playback").attr("src", song.url);
    }

    // Load the next song in the playlist
    function next_song(song, curr_song, num_songs, score) {

        // Reset the input field and focus back on it
        $('#guess').val('');
        $('#guess').focus();

        // Display submit button to prevent accidental submissions
        $('#guess-ans').attr('disabled', true);

        // Check if the last song in the playlist has played
        if (is_finished(curr_song, num_songs)) {

            // Show the final score and button to redirect to other pages
            show_results(score);
        }
        else {

            // Songs still remaining
            update_song_view(song, curr_song, num_songs);
            countdown_timer();
        }

    }

    // Check if the user has guessed correctly
    function mark_guess(guess, artist, songname) {
        if (guess != "" && (artist.includes(guess) || songname.includes(guess))) {

            $('#guess-feedback').html("<div class=\"alert alert-success\" \
            role=\"alert\"> <button type=\"button\" class=\"close\" data-dismiss=\"alert\">x \
            </button> <strong>You got it right!</strong></div>").fadeIn(300);
            var score = $("#score").html();
            score = parseFloat(score.slice(6, score.length));
            score = score + 100;
            $("#score").html("Score: " + score);
        }
        else {
            $('#guess-feedback').html("<div id=\"alert\" class=\"alert alert-danger\" \
            role=\"alert\"> <button type=\"button\" class=\"close\" data-dismiss=\"alert\">x \
            </button> <strong>That's incorrect...</strong></div>").fadeIn(300);
        }

    }

    // Check if its the last song in the playlist
    function is_finished(curr_song, num_songs) {
        return (curr_song >= num_songs) ? true : false;
    }

    // Hide the input and progress divs and show the redirect buttons
    function show_results() {
        $('#guess-box').hide();
        $('#progress-box').hide();
        $('#result-btns').show();
        $('#page-title').html('Results').hide().fadeIn(500);
    }
});