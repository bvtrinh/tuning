# Tuning

## How is this problem solved currently (if at all)?

## How will this project make life better? Is it educational or just for entertainment?

Tuning is a party game, where the players are groups of friends or strangers that compete against one another in a fast-paced game of guessing the song title, artist, or missing lyrics that is associated with a short 10-15 seconds music clip that plays. The aim of Tuning is to provide entertainment and a fun activity for groups of friends or strangers to play on weekends, game nights, trivia nights, bars, etc. which gives them an opportunity to socialize and create closer bonds amongst each other, and make new friends. While, Tuning is more focused on providing entertainment, it does indirectly help make life easier by relieving stress and creating friendships through the fun gameplay and socialization opportunities.

## Who is the target audience?

Our target audience for Tuning is aimed towards young adults who are interested in playing party type games with their own friend groups. As well as, adults who are looking to socialize and create new friendships.

## Does this project have many individual features, or one main feature (possibility with many subproblems)? These are the ‘epics’ of your project.

### Song guessing
An epic that we will be splitting into smaller stories will be the main playable feature of the game itself, guessing the song name. We will be utilizing Spotify’s public API to grab the data (song name, artist, etc) for each song, and musicXMatch API to grab song lyrics. This feature will be broken down into playable categories that are split by different genres of music (eg: rock, pop, jazz), the era of when the song was created (eg: 1930’s), a multiple choice quiz version, and potentially a speech-to-text version. These separate categories and play modes will be our smaller stories, that we can further decompose into smaller, more actionable tasks through backlog grooming and technical decompositions.

### Leaderboards
Leaderboards will provide users the opportunity to compete with their friends and to show off their knowledge of music. For each category of music (rock, hip-hop, modern) there will be two leaderboards associated with it: one for single-player and one for multiplayer. As well as a single and multiplayer global leaderboard that takes the cumulative score of all categories.  Leaderboards will contain the rankings of the top players, their win-loss ratio, how many ranks they gained in the past week and their score. Scores will determine the rankings of the top players on the leaderboards and will be referenced from a user’s profile. Scores will be determined by how quickly a user answers correctly. Leaderboards will be updated periodically every 3 hours (tentative).

### Profiles
Each user will have a unique profile that is kept track of via logging in. These profiles will be what is used to keep track of our leaderboard feature. A profile will consist of a username and leaderboard features such as a personal highscore. In addition, some future features we can think about adding may include incorporating Google Play services or Facebook to help keep track of progress, and adding friends online. Lastly, data, such as most played category, can be recorded to show how much time a user spent on certain categories, which categories are currently the most popular among users, and other meaningful pieces of data that developers can take actions on.

### Multiplayer

## What are some sample stories/scenarios? For example, as a regular user to your site, what types of things can I do? These are the ‘stories’ of your project.

Any user would be able to log in to their unique account and be given the option to either create a party,join a party, or start a solo game. If the user chose to create a party then others would be able to join the party using a password and they could play a multiplayer match. When playing, users will be given the option to pick their genre or era of music as well as the option of if they would like to play the standard text input version,  a multiple-choice version or potentially even a speech to text version. For example, if the user chose the text input version, they would be prompted to type the name of the song and artist after the sample snipper of the song has been done playing. If the user chose multiple choice version, there would be four choices to pick from and the user would need to select one. Each user would also have the option of viewing their personal leaderboards or global leader boards to check high scores and win/loss records.


## Is the amount of work required in this proposal enough for five group members?

Yes, we believe it to be enough work. We plan on implementing different modes of play, such as text input, multiple choice, and potentially speech recognition. Along with options of multiplayer or solo play. There will also be the task of implementing two API’s, one for displaying the lyrics and the other for getting the artist and song information. Lastly, we would need to deal with the creation of profiles and linking these them to leaderboards.

