const express = require('express');
const path = require('path');
const {check, validationResult} = require('express-validator');
const cookieParser = require('cookie-parser');
const expressSession = require('express-session');
const PORT = process.env.PORT || 5000
var app = express();

var bcrypt = require('bcrypt');
const saltRounds = 10;
// const db = require('./db');
// for when we create database
const { Pool } = require('pg');
var pool;
pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(expressSession({secret: 'tuning', saveUninitialized: false, resave: false}));
app.use(cookieParser());
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    if(req.session.username){
      res.redirect('play');
    }
    else{
      res.render('pages/index', {title: 'home'});
    }
});

app.get('/login', (req, res) => {res.render('pages/login', {errors: null})});

app.get('/signup', (req,res) => {res.render('pages/signup', {errors: null})});

app.post('/sign_in', (req, res) => {
  var username = req.body.username;
  var password = req.body.password;
  var errors = null;
  // hash
  // validate on db
  pool.query(`SELECT password FROM users WHERE username = '${username}'`, (error, results) => {
    if (error) {
      throw error;
    }

    if (results.length == 0) {
      res.render('pages/login', {errors: [{msg:'Incorrect username and/or password'}]});

    }

    const hash = results.rows[0].password.toString();

    bcrypt.compare(password,hash,function(err,response) {
      if(response==true){
        req.session.username = username;
        res.redirect('play');
      }
      else{
        res.render('pages/login', {errors: [{msg:'Incorrect username and/or password'}]});
      }
    });

  });
});

app.post('/sign_up', [check('password','password is too short').isLength({ min: 5 }), check('username','username is too short').isLength({min:5})], (req, res) => {
  var username = req.body.username;
  var password = req.body.password;
  var confirmPassword = req.body.confirmPassword;
  pool.query(`SELECT * FROM users WHERE username = '${username}'`, (error, results) => {
    if (error) {
      throw error;
    }

    if (results.length != 0) {
      res.render('pages/signup', {errors: [{msg:'username is already in use'}]});
    }
  }
  //  else
  var errors = validationResult(req);
  if(!(req.body.password === req.body.confirmPassword)){
    res.render('pages/signup', {errors: [{msg:'Passwords do not match'}]});
  }
  else if(!errors.isEmpty()){
    res.render('pages/signup', errors)
  }else{
    //    hash
    //    insert into database values (username, password)
    //    dont know db name yet, so swap out users with db name
    bcrypt.hash(password, saltRounds, function(err, hash) {

      pool.query(`INSERT INTO users (username, password) VALUES ('${username}', '${hash}')`, (error) => {
        if (error) {
          throw error;
        }
      });

    });

    req.session.username = username;
    res.redirect('play');
  }
});

app.get('/play', (req, res) => {
  if(req.session.username){
    res.render('pages/landing', {username: req.session.username, title: 'play'});
  }else{
    res.redirect('login');
  }
});

app.get('/logout', (req, res) => {
  if(req.session.username){
    req.session.destroy((err) =>{});
    res.redirect('/');
  }else{
    res.redirect('login');
  }
});

app.get('*', function(req, res){
    res.status(404).send('ERROR 404: The page you requested is invalid or is missing, please try something else')
  })

app.listen(PORT, () => console.log(`Listening on ${ PORT }`));
