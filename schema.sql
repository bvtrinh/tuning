CREATE TABLE users(
    id SERIAL PRIMARY KEY,
    username VARCHAR(20),
    password TEXT

);

CREATE TABLE songs(
          artistID text,
          artistName text,
          songID text PRIMARY KEY,
          songName text,
          genre text[],
          URL text
);

INSERT INTO users(
    username, password) VALUES ('ttrinh', 'tst');
