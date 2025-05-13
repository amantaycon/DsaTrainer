require("dotenv").config();
const express = require("express");
const router = express.Router();
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const con = require('../mysqlcon');
const fs = require("fs");
const path = require("path");

// connection to database of mysql
con.connect((err) => { if (err) { console.error('Error connecting to MySQL:', err); return; } });

// const { geHaNum } = require('./function'); // some function import from function file


function setLogin(user, req, res) {
    var str = "SELECT * FROM users WHERE email = ?";
    con.query(str, [user], (err, results) => {
        if (err) { console.error('Error executing query:', err); return; }
        user = results[0].userurl;
        //   var skey = geHaNum(results[0].passwd);
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


// Initialize Passport
router.use(passport.initialize());
router.use(passport.session());

// Configure Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
    const googleId = profile.id;
    const name = profile.displayName;
    const email = profile.emails[0].value;
    const profilePic = profile.photos[0]?.value || null; // Google profile picture URL

    // Save profile pic to server
    if (profilePic) {
        const filename = `profile-${googleId}.jpg`;
        const filePath = path.join(__dirname, "../userdata", filename);

        try {
            const response = await fetch(profilePic);
            const buffer = await response.arrayBuffer();
            fs.writeFileSync(filePath, Buffer.from(buffer));
        } catch (error) {
            console.error("Failed to download profile picture:", error);
        }
    }

    // Check if user exists in MySQL
    con.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
        if (err) return done(err);

        const profilePicUrl = path.join(__dirname, "../userdata", `profile-${googleId}.jpg`);

        if (results.length > 0) {
            // Update profile picture if changed
            if (results[0].profile_photo_url == null) {
                con.query("UPDATE users SET profile_photo_url = ? WHERE id = ?", [profilePicUrl, results[0].id]);
            }
            return done(null, results[0]);
        } else {
            // Insert new user
            con.query("INSERT INTO users (fullname, email, profile_photo_url) VALUES (?, ?, ?)",
                [name, email, profilePicUrl],
                (err, result) => {
                    if (err) return done(err);
                    const userId = result.insertId;

                    var username1 = userId + "_username";
                    // set username and profile_dp_link default value for new user
                    const str1 = "UPDATE users SET username = ?, userurl = ? WHERE id = ?";
                    con.query(str1, [username1, username1, userId], (err) => {
                        if (err) { console.error('Error executing query:', err); return; }

                        // Create the directory for store all user data
                        fs.mkdir('./userdata/' + username1, { recursive: true }, (err) => {
                            if (err) { return console.error('Error creating directory:', err); }
                        });
                        return done(null, { id: result.insertId, name, email, profile_photo_url: profilePicUrl });
                    });
                });
        }
    });
}));

// Serialize user
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    con.query("SELECT * FROM users WHERE id = ?", [id], (err, results) => {
        if (err) return done(err);
        done(null, results[0]);
    });
});

// Google Authentication Route
router.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// Google Callback Route
router.get("/auth/google/callback", passport.authenticate("google", {
    successRedirect: "/googledone",
    failureRedirect: "/login"
})
);

// Dashboard Route
router.get("/googledone", (req, res) => {
    if (!req.isAuthenticated()) {
        return res.redirect("/login");
    }
    return setLogin(req.user.email, req, res);
});

module.exports = router;
