
$(document).ready(function () {

    var audio = document.getElementById('playback');
    audio.volume = 0.2;

    function countdown_timer() {
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
                audio.play();
            }
        },1000);

    };
    countdown_timer();


    $("#guess_ans").click( countdown, function() {

        var guess = $("#guess").val();

        $.ajax({
            url: "/mark",
            method: "GET",
            data: {
                guess: guess,
            },
            dataType: "JSON",
            success: function(data) { 
                $('#guess-feedback').fadeOut(400);
                $('#guess-feedback').html("<div class=\"alert alert-" + data.alert_class + "\" \
                role=\"alert\"> <button type=\"button\" class=\"close\" data-dismiss=\"alert\">x \
                </button> <strong>" + data.result_msg + "</strong></div>").fadeIn(300);
                $('#guess').val('');
                audio.pause();
            },
            error: function(err) {
                console.log(err);
            }
        });


        setTimeout(function () {
            $.ajax({
                url:"/next-song",
                method: "GET",
                data: {
                    guess: guess,
                },
                dataType: "JSON",
                success: function(data) {
                    $('#guess-feedback').fadeOut(400);
                    $('#playback').attr('src', data.song_url);
                    countdown_timer();
                },
                error: function(err) {
                    console.log(err);

                }
            });
        }, 5000);

    });

});