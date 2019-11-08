CREATE TABLE users(
    id SERIAL PRIMARY KEY,
    username VARCHAR(20),
    password TEXT

);

CREATE TABLE songs(
          artistID varchar,
          artistName text,
          songID varchar PRIMARY KEY,
          songName text,
          genre json,
          URL text
);

INSERT INTO users(
    username, password) VALUES ('ttrinh', 'tst');
