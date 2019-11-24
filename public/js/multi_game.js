$$(document).ready(function() {

    // Set the initial volume
    $("#audio-playback").prop("volume", 0.5);
    $("#score").html("Score: 0")

    // All users have ready'ed up ('ready')
    // Countdown from server via chat  (serverside) ('message')
    // If new user enters the lobby stop countdown or if someone unready's (serverside)
    
    //counter is finished (serverside)
    //Server will grab playlist according to genre (query and boardcast)
    //send playlist to each user (broadcast from server to all players) ('loadPlaylist')
    //  assign playlist to the variable (client side)
    // Hide the lobby page (.hide()) 

    // Bring up the game page (.show())

    //LOOP until playlist runs out
        
        //server broadcast the actual countdown number to all players ('countdown', runs a function)

        //server is done countdown & server broadcast to load next song ('loadnextsong' songindex)

        // if a user submits then broadcast to other users that they have submitted ('answered')
    
        // and increment their score, update the scoreboard / change ranking (pqueue steal from someone) ('updateScoreboard')
            
        //Server waits for either everyone to answer or timesout setinterval(100
        //{checkif len(peopleanswered) == len(players){exitsetinterval //update our song index}}
        //else if the song is playing update progress bar
        
    //LOOP

    //server broadcast game done ('loadresultpage')
    // taking the (scores, userid, genre, gameMode) and logging the database (user ajax updates their own score)
    //display results/song list (we have playlist, and rerender the score table into result section)


    
    
    function gameplay(playlist) {

        


    }





});