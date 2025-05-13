const express = require('express');
const app = express();
const con = require('./mysqlcon');
const port = 3000;
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const cors = require('cors');

app.use(cors({
  origin: 'http://localhost:5174'
}));



// const { geHaNum, checkLogin } = require('./router/function');

// set session for all users
sessionMiddleware = session({
  secret: process.env.SESSION_SECRET, // Load secret from environment
  resave: false,
  saveUninitialized: false, // Only save sessions when there’s data
  cookie: {
    secure: false, // Set secure to true in production
    maxAge: 1000 * 60 * 60  // Optional: Set a maximum age for the session (e.g., 1 hour)
  }
});

app.use(sessionMiddleware);

// create table to store all login user details it create onle at once
con.connect((err) => {
  if (err) { console.error('Error connecting to MySQL:', err); return; }
  var columns = `id INT AUTO_INCREMENT PRIMARY KEY,
      fullname VARCHAR(255),
      username VARCHAR(50) UNIQUE,
      userurl VARCHAR(100) UNIQUE,
      passwd VARCHAR(500),
      admin BOOLEAN DEFAULT 0,
      notification INT DEFAULT 0,
      email VARCHAR(255) UNIQUE NOT NULL,
      profile_photo_url VARCHAR(500),
      gender INT DEFAULT 0,  -- Assuming
      bio TEXT,
      themename varchar(100) DEFAULT 'defaulthemes.css',  -- Assuming a number corresponds to different themes
      skey varchar(500),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`;

  var sql = `CREATE TABLE IF NOT EXISTS users (${columns})`;
  con.query(sql, (err) => {
    if (err) { console.error({ error: 'Error creating users table', details: err }); return; }
  });

  var columns = `id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255),
      url VARCHAR(500)`;
  var sql = `CREATE TABLE IF NOT EXISTS headerlist (${columns})`;
  con.query(sql, (err) => {
    if (err) { console.error({ error: 'Error creating headerlist table', details: err }); return; }
  });
  

  var columns = `id INT PRIMARY KEY AUTO_INCREMENT,
      title VARCHAR(255)`;
  var sql = `CREATE TABLE IF NOT EXISTS featured (${columns})`;
  con.query(sql, (err) => {
    if (err) { console.error({ error: 'Error creating featured table', details: err }); return; }
  });

  var columns = `id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      slogan VARCHAR(255),
      link VARCHAR(500),
      featured_id INT,
      FOREIGN KEY (featured_id) REFERENCES featured(id) ON DELETE CASCADE`;
  var sql = `CREATE TABLE IF NOT EXISTS sub_header (${columns})`;
  con.query(sql, (err) => {
    if (err) { console.error({ error: 'Error creating sub_header table', details: err }); return; }
  });

});

// Serve static files (like images, CSS, JavaScript) from the 'public' directory
app.use(express.static('public'));

// Set the template engine to EJS (Embedded JavaScript) for rendering views
app.set('view engine', 'ejs');

// Middleware to parse JSON bodies from incoming requests
app.use(bodyParser.json());

// Middleware to parse URL-encoded bodies (form submissions) from incoming requests
// The 'extended: true' option allows for rich objects and arrays to be encoded
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware to parse cookies from the request headers
app.use(cookieParser());

// Middleware to parse JSON bodies from incoming requests (alternative to bodyParser.json())
app.use(express.json());

// Middleware to handle all routes related to user login
app.use('/', require('./router/login'));

app.use('/', require('./router/google'));

// Middleware to manage user settings and preferences
app.use('/', require('./router/setting'));

// Middleware to manage home page layouts and content
app.use('/home/', require('./router/home'));


app.use('/', require('./router/upload'));

// serve the home page
app.get('/', (req, res) => {
    req.session.login = true;
    req.session.idd = 1;
    req.session.admin = true;
    req.session.userurl = "1_username";
    req.session.email = "amantaycon@gmail.com";
    req.session.fullname = "";
    req.session.themename = "defaulthemes.css";


  var sql = `SELECT * FROM headerlist ORDER BY id ASC`; // Ensures correct order

    con.query(sql, (err, result) => {
        if (err) {
            console.error('Error fetching headerlist:', err);
            return res.status(500).json({ error: 'Database query failed', details: err.message });
        }

        // Convert result into an array of [title, url] pairs
        const headerlist = result.map(row => [row.title, row.url]);

        if(req.session.login){
          var user = {username: req.session.username, userurl: req.session.userurl, admin: req.session.admin, email: req.session.email, themename: req.session.themename};
          res.render('home', { headerlist: headerlist , user: user}); 
        }else{
          var user = null;
          res.render('home', { headerlist: headerlist , user: user});
        }
    });
});

// Middleware to manage all content pages
app.use('/', require('./router/contentpage'));


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});

app.use((req, res) => {
  res.status(404).render('404');
});
