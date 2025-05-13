const express = require('express');
const app = express.Router();
const fs = require('fs');
const con = require('../mysqlcon');
const sendOTP = require("./mailService");
const pwhash = require('bcryptjs');
const path = require('path');
const saltRounds = 6;

// connection to database of mysql
con.connect((err) => { if (err) { console.error('Error connecting to MySQL:', err); return; } });


const { geHaNum } = require('./function'); // some function import from function file

// send otp to given email
async function sendOtp1(user) {
  try {
    const otp2 = await sendOTP(user);
    return otp2;
  } catch (error) {
    console.log({ error: "failed to send OTP" });
    return -1;
  }
}

// sleep function to delay login process for security reason
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// set login true and more data on session and cookie
function setLogin(user, req, res) {
  var str = "SELECT * FROM users WHERE email = ?";
  con.query(str, [user], (err, results) => {
    if (err) { console.error('Error executing query:', err); return; }

    user = results[0].userurl;
    var skey = geHaNum(results[0].passwd);
    var idd = results[0].id;
    req.session.login = true;
    req.session.idd = idd;
    req.session.admin = results[0].admin;
    req.session.userurl = results[0].userurl;
    req.session.fullname = results[0].fullname;
    req.session.themename = results[0].themename;
    return res.redirect(req.session.redirect || '/');
  });
}

// This is first state of user login process
app.post('/auth', async (req, res) => {
  if (req.session.login) return res.redirect(req.session.redirect || '/'); // if user already login then skiped and go /
  else {
    // delay 2 second
    await sleep(2000);
    req.session.mid = -1;
    var user = req.body.user;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // test user input email or username
    if (emailRegex.test(user)) {
      var email = user.toLowerCase().trim();
      req.session.email = email;
      req.session.user = email;
      var str = "SELECT id FROM users WHERE email = ?";
      con.query(str, [email], async (err, results) => {
        if (err) { console.error('Error executing query:', err); return; }

        // check user click next or create new account
        if (req.body.next == 'next') {

          // if user found go to enter password page
          if (results.length == 1) {
            var mode = { id: 1, username: email, err: 0, error: "" };
            res.render("loginpage", { mode }); return;
          }

          // if user not found go to same page with error
          else {
            var mode = { id: 0, username: "", err: 1, error: "This Email-Id not exits in Database" };
            res.render("loginpage", { mode }); return;
          }
        }

        // check user click next or create new account
        else if (req.body.next == 'create_account') {

          // check to user not present in database
          if (results.length == 0) {
            req.session.mid = 0; // tell this is new user
            req.session.otp = await sendOtp1(email); // sent otp to provided email id
            console.log(req.session.otp);
            // id: 2 tell to show enter otp page
            var mode = { id: 2, username: email, err: 0, error: "OTP has been sent Successfully" };
            res.render("loginpage", { mode }); return;
          }

          // if already login goto login page with error
          else {
            var mode = { id: 0, username: "", err: 1, error: "This Email-Id already exits in Database" };
            res.render("loginpage", { mode });
            return;
          }
        }
      });
    }

    // if user enter username means user alredy ragistred
    else {
      var user = user.toLowerCase().trim();
      req.session.user = user;
      // serch in database to user founnd or not
      var str = "SELECT id, email FROM users WHERE userurl = ?";
      con.query(str, [user], (err, results) => {
        if (err) { console.error('Error executing query:', err); return; }

        // check user click to next button
        if (req.body.next == 'next') {
          // check user found or not
          if (results.length == 1) {
            email = results[0].email;
            req.session.email = email;
            var mode = { id: 1, username: user, err: 0, error: "" }; // serve password enterface
            res.render("loginpage", { mode });
            return;
          }

          // serve error to user is not found
          else {
            var mode = { id: 0, username: "", err: 1, error: "This Username not exits in Database" };
            res.render("loginpage", { mode });
            return;
          }
        }

        // if user clicked create acount then serve error to user 
        else if (req.body.next == 'create_account') {
          var mode = { id: 0, username: "Wrong Email id", err: 1, error: "Please Enter a valid Email-Id" };
          res.render("loginpage", { mode })
          return;
        }
      });
    }
  }
});

// This is otp verify section
app.post('/auth1', async (req, res) => {
  if (req.session.login) { return res.redirect(req.session.redirect || '/'); } // if user already login then skiped and go '/'

  // delay 2 second
  await sleep(2000);

  // check user clicked next button
  if (req.body.next == "next") {
    // check otp match or not
    if (req.body.otp == req.session.otp) {
      // show password setup page
      var mode = { id: 3, username: req.session.user, err: 0, error: "" }; res.render("loginpage", { mode });

      // check user new ragistred
      if (req.session.mid === 0) {
        // one time perform all task to nessasry for new users
        // insert user in table users
        var str = "INSERT INTO users (email) VALUES (?)";
        con.query(str, [req.session.email], (err, results) => {
          const userId = results.insertId;
          if (err) { console.error('Error executing query:', err); return; } req.session.mid = -1; // set user is ragistred
          
          var username1 = userId + "_username";
          // set username and profile_dp_link default value for new user
          const str1 = "UPDATE users SET username = ?, userurl = ?, profile_photo_url = ? WHERE id = ?";
          con.query(str1, [username1, username1, path.join(__dirname, '../userdata/nodp.png'), userId], (err) => {
            if (err) { console.error('Error executing query:', err); return; }

            // Create the directory for store all user data
            fs.mkdir('./userdata/' + username1, { recursive: true }, (err) => {
              if (err) { return console.error('Error creating directory:', err); }
            });
          });
        });
      }
    }
    // if not match goto to same page with error
    else { mode = { id: 2, username: req.session.user, err: 1, error: "You entered otp is wrong" }; res.render("loginpage", { mode }) }
  }
  else { res.redirect('/login'); } // serve login page
  return;
});

// new password set section
app.post('/auth2', async (req, res) => {
  if (req.session.login) { return res.redirect(req.session.redirect || '/'); } // if user already login then skiped and go '/'

  // delay 2 second
  await sleep(2000);

  // if user click next button
  if (req.body.next == "next") {

    // check both password same or not
    if (req.body.pass1 == req.body.pass2) {

      // check password must containt 8 or more length
      if (req.body.pass1.length >= 8) {

        // password before storing is hash encoded
        pwhash.hash(req.body.pass1, saltRounds, (err, hashedPassword) => {
          if (err) { console.error(err); }
          else {

            // password is update with new password
            var str = "UPDATE users SET passwd = ? WHERE email = ?";
            con.query(str, [hashedPassword, req.session.email], (err) => {
              if (err) { console.error('Error executing query:', err); }
              setLogin(req.session.email, req, res);
            }); // set user login true
          }
        });
      }

      // return error page with message
      else { var mode = { id: 3, username: req.session.user, err: 1, error: "Please enter Minimum 8 digit password" }; res.render("loginpage", { mode }); }
    }

    // if both password not same return error page
    else { mode = { id: 3, username: req.session.user, err: 1, error: "Please enter same password(Password Mismatch)" }; res.render("loginpage", { mode }); }
  }

  // if user clicked skip button
  else if (req.body.next == "skip") { setLogin(req.session.email, req, res); } // set login to browes tell user login and return
  else { res.redirect('/login'); } // serve login page
});

// check user password match with database password true or false
app.post('/auth3', async (req, res) => {
  if (req.session.login) { return res.redirect(req.session.redirect || '/'); } // if user already login then skiped and go '/'

  // delay 2 second
  await sleep(2000);

  // check user click on next button
  if (req.body.next == "next") {

    var str = "SELECT id, passwd FROM users WHERE email = ?";
    con.query(str, [req.session.email], (err, results) => {
      if (err) { console.error('Error executing query:', err); return; }

      // check password null return error page with message
      if (results[0].passwd == null) {
        var mode = { id: 1, username: req.session.user, err: 1, error: "First Set Your Password to click forget password" };
        res.render("loginpage", { mode }); return;
      } else {

        // check entered password match or not
        pwhash.compare(req.body.pass, results[0].passwd, (err, isMatch) => {
          if (err) { console.error(err); }
          else if (isMatch) { setLogin(req.session.email, req, res); } // set user login
          // return wrong password message with error
          else {
            var mode = { id: 1, username: req.session.user, err: 1, error: "Username or Password is incorrect" };
            res.render("loginpage", { mode }); return;
          }
        });
      }
    });
  }
  // user click with otp login
  else if (req.body.next == "withotp") {
    req.session.otp = await sendOtp1(req.session.email); // send otp to user email
    var erro = "OTP has been sent Successfully";
    console.log(req.session.otp);
    if (req.session.otp == -1) {
      erro = "Error of sending OTP";
    }
    var mode = { id: 2, username: req.session.email, err: 0, error: erro }; req.session.mid = -1;
    res.render("loginpage", { mode }); return;
  }
  else { res.redirect('/login'); } // serve login page
});

// serve login page to user
app.get('/login', (req, res) => {
  req.session.redirect = req.query.redirect || '/';
  if (req.session.login) { res.redirect(req.session.redirect); return; } // if user already login then skiped and go '/'
  else {
    // serve login page
    var mode = { id: 0, username: "", err: 0, error: "" };
    res.render("loginpage", { mode })
  }
});

// corrent login user logout current browser
app.get('/logout', (req, res) => {
  const redirect = req.query.redirect || '/';
  req.session.login = false;
  req.session.destroy();
  res.clearCookie('login');
  res.clearCookie('email');
  res.clearCookie('skey');
  res.redirect(redirect);
});



module.exports = app;