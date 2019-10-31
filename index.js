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

app.get('/', (req, res) => {
    // Used to identify the current page to display login or username
    // Once sessions are setup, used that variable instead to check if they are logged in
    res.render('pages/index', {title: 'home'});
});

app.get('/login', (req, res) => {res.render('pages/login')});

app.get('/signup', (req,res) => {res.render('pages/signup')});

app.post('/sign_in', (req, res) => {
    var username = req.body.username;
    var password = req.body.password;

    // Validate here

    res.send(username + ' is logged in!');

});

app.post('/sign_up', (req, res) => {
    var username = req.body.username;
    // query db and check if the username is already in username
    //  if username is already in use, send error message and re-render page
    //  else
    //    var password = req.body.password;
    //    if(password != req.body.confirmPassword)
    //      send error message and re-render page (preferably with the same username)
    //    insert into database values (username, password)
    //    render homepage
});

app.get('/play', (req, res) => {
    // Used to identify the current page to display login or username
    // Once sessions are setup, used that variable instead to check if they are logged in
    res.render('pages/landing', {title: 'play'});
});

app.get('*', function(req, res){
    res.status(404).send('ERROR 404: The page you requested is invalid or is missing, please try something else')
  })
  
app.listen(PORT, () => console.log(`Listening on ${ PORT }`));
