const express = require('express');
const path = require('path');
const PORT = process.env.PORT || 5000
var app = express();

const { Pool } = require('pg');
var pool;
pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {res.render('pages/index')});

app.get('/login', (req, res) => {res.render('pages/login')});

app.post('/sign_in', (req, res) => {
    var username = req.body.username;
    var password = req.body.password;

    res.send(username);

});

app.listen(PORT, () => console.log(`Listening on ${ PORT }`));
