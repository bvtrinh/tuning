CREATE TABLE users(
    id SERIAL PRIMARY KEY,
    username VARCHAR(10),
    password TEXT
);

INSERT INTO users(
    username, password) VALUES ('ttrinh', 'tst');
