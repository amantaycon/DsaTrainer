const express = require('express');
const multer = require('multer');
const path = require('path');
const app = express.Router();
const con = require('../mysqlcon');
const { dateformate } = require('./function');
// connecting database
con.connect((err) => { if (err) { console.error('Error connecting to MySQL:', err); return; } });

// serve setting page
app.get('/setting', (req, res) => {
    if (req.session.login) {
        const idd = req.session.idd;
        var str = "SELECT * FROM users WHERE id = ?";
        con.query(str, [idd], (err, results) => {
            if (err) { console.error('Error executing query:', err); return; }
            results[0].click = 6;
            str = `select name from THEMES`;
            con.query(str, (err, resut) => {
                if (err) { console.error('Error executing query:', err); return; }
                res.render('settings', { data: results[0], themes: resut });
                return;
            });
        });
    } else { res.redirect('/login'); }
});

// check userurl valid or not
async function userurlck(userurl, req) {
    const minLength = 4;           // Minimum length requirement
    const maxLength = 50;          // Maximum length requirement
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    const url = ['checkuserurl', 'setting', 'upload', 'uploadpostdata', 'auth', 'auth1', 'auth2', 'auth3', 'login', 'logout', 'concheck', 'conchange', 'userpost', 'connted_list', 'connting_list', 'Public', 'css', 'css1', 'image', 'requested', 'response', 'suggested', 'dashboard'];
    return new Promise((resolve) => {

        // if userurl not valid send false
        if (userurl.length < minLength || userurl.length > maxLength || !usernameRegex.test(userurl) || url.includes(userurl)) {
            resolve(false);
        }
        else {
            // if username is same to previous
            if (req.session.userurl == userurl) {
                resolve(true);
            }
            else {
                var str = `select userurl from users where userurl = ?`;
                con.query(str, [userurl], (e, r) => {
                    // if userurl not valid send false
                    if (r.length > 0) {
                        resolve(false);
                    }
                    // if userurl valid send true
                    else {
                        resolve(true);
                    }
                });
            }
        }
    });
}

// update user setting data
app.post('/setting', async (req, res) => {
    if (req.session.login) {
        const idd = req.session.idd;
        var userurl = req.body.username.toLowerCase();

        // if userurl not valid set session url
        if (!await userurlck(userurl, req)) {
            userurl = req.session.userurl;
        }
        var str = `select name from THEMES where name = ?`;
        con.query(str, [req.body.theme], (err, resut) => {
            if (err) { console.error('Error executing query:', err); return; }
            if (resut.length == 0) { res.send("Theme Not Available"); return }
            req.session.themename = resut[0].name;

            var str = "UPDATE users SET userurl = ?,fullname = ?,gender = ?,bio = ?,notification = ?,themename = ? WHERE id = ?";
            con.query(str, [userurl, req.body.fullname, req.body.gender, req.body.bio, req.body.notification, req.body.theme, idd], (err) => {
                if (err) { console.error('Error executing query:', err); return; }
                req.session.userurl = userurl;
                req.session.fullname = req.body.fullname;
                res.send("Update Successfully"); return;
            });
        });
    } else { res.redirect('/login'); }
});

// chake user name valid or not
app.post('/checkuserurl', async (req, res) => {
    res.send(await userurlck(req.body.userurl.toLowerCase(), req));
});

// served user profile pic
app.get('/:userurl/profile_pic', (req, res) => {
    const userurl = req.params.userurl;
    if (userurl == 'login') {
        res.setHeader('Content-Type', 'image/jpeg'); // Or set dynamically based on the file type
        res.sendFile(path.join(__dirname, '../userdata/nodp.png'));
        return;
    }
    var str = "SELECT profile_photo_url FROM users WHERE userurl = ?";
    con.query(str, [userurl], (err, results) => {
        if (err) { console.error('Error executing query:', err); return; }
        if (results.length > 0) {
            res.setHeader('Content-Type', 'image/jpeg'); // Or set dynamically based on the file type
            res.sendFile(results[0].profile_photo_url);
            return;
        } else { res.status(404).send('Not Available 404'); return; };
    });
});

// Configure multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../userdata/' + req.session.idd + '_username'));  // Ensures cross-platform compatibility
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

// Initialize multer with the configured storage
const upload = multer({ storage: storage });

// Handle file upload route
app.post('/upload', upload.single('profilePicture'), (req, res) => {
    if (req.session.login) {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Successfully uploaded cropped image
        var str = "UPDATE users SET profile_photo_url = ? WHERE id = ?";
        con.query(str, [req.file.path, req.session.idd], (err, results) => {
            if (err) { console.error('Error executing query:', err); return; }
            res.send("Update Successfully");
        });
    } else { res.status(403).send('Forbinned'); }
});


// serve url profile page
app.get('/:userurl', (req, res) => {
    const userurl = req.params.userurl; // store userurl from link
    // select all nessesary data from url user
    const str = `select id, userurl, fullname, bio from users where userurl = ?`;
    con.query(str, [userurl], (e, r) => {
        if (e) { console.error('Error executing query:', e); return; }

        // if url user is present
        if (r.length > 0) {

            var sql = `SELECT * FROM headerlist ORDER BY id ASC`; // Ensures correct order
            con.query(sql, (err, result) => {
                if (err) {
                    console.error('Error fetching headerlist:', err);
                    return res.status(500).json({ error: 'Database query failed', details: err.message });
                }

                // Convert result into an array of [title, url] pairs
                const headerlist = result.map(row => [row.title, row.url]);

                if (req.session.login) {
                    const r1 = { id: req.session.idd, userurl: req.session.userurl, fullname: req.session.fullname, email: req.session.email, admin: req.session.admin, themename: req.session.themename };
                    if (req.session.idd == r[0].id) { r1.click = 5; }
                    else { r1.click = 2; }
                    res.render('profile.ejs', { user: r1, data: r[0], headerlist });
                }
                else {
                    const r1 = null;
                    res.render('profile.ejs', { user: r1, data: r[0], headerlist });
                }
            });
        }
        else { res.status(404).render('404'); }
    });
});

module.exports = app;