CREATE TABLE users(
    id SERIAL PRIMARY KEY,
    username VARCHAR(10),
    password TEXT
);


INSERT INTO tokis (
    name, height, weight, fly, fight, fire, 
    water, electric, ice, total, trainer_name)
    VALUES ('pikachu',130,10,0,12,0,0,100,10,132,'ash ketchum');

INSERT INTO users(
    username, password) VALUES ('ttrinh', 'tst');