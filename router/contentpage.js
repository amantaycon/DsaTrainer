const express = require('express');
const app = express.Router();
const con = require('../mysqlcon');
const { insertData, givemedata, updateData } = require('./function');

// connecting database
con.connect((err) => { if (err) { console.error('Error connecting to MySQL:', err); return; } });

app.get('*', (req, res) => {
    let path = req.path.substring(1); // Remove leading '/'
    // Allow search for both `/content/data` and `content/data`
    let altPath = path.startsWith('/') ? path.substring(1) : `/${path}`;

    let id = req.query.id || 1; // Default id to 1 if not provided
    var sql = 'SELECT * FROM sub_header WHERE (link = ? OR link = ?)';
    con.query(sql, [path, altPath], (err, results) => {
        if (err) {
            console.error('Error executing query:', err);
            return res.status(500).send('Internal Server Error');
        }
        if (results.length > 0) {
            if (!path.startsWith('/')) path = `/${path}`;
            const url = { url: path };
            var sql = `SELECT * FROM \`${results[0].featured_id + '' + results[0].name}_nav\` WHERE id = ?`;
            con.query(sql, [id], (err, result) => {
                if (err) {
                    console.error('Error fetching content:', err);
                    return res.status(500).send('Internal Server Error');
                }
                else if (result.length > 0 || (id == 1 && req.session.login && req.session.admin)) {
                    var data = null;
                    if (result.length > 0) {
                        data = result[0];
                    }
                    var sql = `SELECT * FROM headerlist ORDER BY id ASC`; // Ensures correct order

                    con.query(sql, (err, result) => {
                        if (err) {
                            console.error('Error fetching headerlist:', err);
                            return res.status(500).json({ error: 'Database query failed', details: err.message });
                        }

                        // Convert result into an array of [title, url] pairs
                        const headerlist = result.map(row => [row.title, row.url]);

                        if (req.session.login) {
                            var user = { username: req.session.username, userurl: req.session.userurl, admin: req.session.admin, email: req.session.email, themename: req.session.themename};
                            res.render('contentpage', { headerlist: headerlist, user: user, data: data, nav: results[0], path: url });
                        } else {
                            var user = null;
                            res.render('contentpage', { headerlist: headerlist, user: user, data: data, nav: results[0], path: url });
                        }
                    });
                } else {
                    res.status(404).render('404');
                }
            });
        } else {
            res.status(404).render('404');
        }
    });
});

// Get content nav for a specific page
app.post('/contentpage/nav', (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).send('Bad Request');
    }
    var sql = `SELECT * FROM \`${name}\``;
    con.query(sql, (err, results) => {
        if (err) {
            console.error('Error executing query:', err);
            return res.status(500).send('Internal Server Error');
        }
        res.json(results);
    });
});

//crteate a new page nav and data structure
app.post('/content/createnav', async (req, res) => {
    if (req.session.login && req.session.admin) {
        const { title, nav_title, keyword = '', description = '', name } = req.body;

        // Validate required parameters
        if (!title || !nav_title || !name) {
            return res.status(400).json({ error: 'Invalid parameters' });
        }

        try {
            // Insert default content into MongoDB
            const data = { data: '//Write Content here' };
            const content_address = await insertData(data);

            // If MongoDB insertion fails, return an error response
            if (!content_address) {
                return res.status(500).json({ error: 'Failed to insert content in MongoDB' });
            }

            // Insert into MySQL
            const sql = `INSERT INTO ${name} (title, nav_title, description, keyword, content_address) VALUES (?, ?, ?, ?, ?)`;
            con.query(sql, [title, nav_title, description, keyword, content_address], (err, result) => {
                if (err) {
                    console.error('Error inserting nav-data:', err);
                    return res.status(500).json({ error: 'Database error', details: err.message });
                }
                res.json({ message: 'done', insertedId: result.insertId });
            });

        } catch (err) {
            console.error('Unexpected Error:', err);
            res.status(500).json({ error: 'Server error', details: err.message });
        }
    } else {
        res.status(403).json({ error: 'Unauthorized access' });
    }
});

// return all list of nav data
app.post('/content/nav/data', (req, res) => {
    const { id, name } = req.body;
    // Validate required parameters
    if (!id || !name) {
        return res.status(400).json({ error: 'Invalid parameters' });
    }

    var sql = `SELECT * FROM ${name} WHERE id = ?`;
    con.query(sql, [id], (err, ress) => {
        if (err) {
            console.error('Error selecting nav-data:', err);
            return res.status(500).json({ error: 'Database error', details: err.message });
        }
        res.json(ress[0]);
    });
});

// update specific nav and page SEO data
app.post('/content/updatenav', (req, res) => {
    if (req.session.login && req.session.admin) {
        const { title, nav_title, keyword = '', description = '', name, id } = req.body;

        // Validate required parameters
        if (!title || !nav_title || !name) {
            return res.status(400).json({ error: 'Invalid parameters' });
        }

        const sql = `UPDATE ?? SET title = ?, nav_title = ?, keyword = ?, description = ? WHERE id = ?`;

        con.query(sql, [name, title, nav_title, keyword, description, id], (err, ress) => {
            if (err) {
                console.error('Error updating nav-data:', err);
                return res.status(500).json({ error: 'Database error', details: err.message });
            }
            res.json({ message: 'done', affectedRows: ress.affectedRows });
        });

    } else {
        res.status(403).json({ error: 'Unauthorized access' });
    }
});

// return page data
app.post('/content/pagedata', async (req, res) => {
    try {
        const { content_address } = req.body;

        // Validate required parameter
        if (!content_address) {
            return res.status(400).json({ error: 'Invalid parameters' });
        }

        const data = await givemedata(content_address);

        if (!data) {
            return res.status(404).json({ error: 'No data found', data: null });
        }

        res.json(data);

    } catch (error) {
        console.error('Server Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/content/pagedata/prenext', (req, res) => {
    const { name, id } = req.body;

    // Validate required parameter
    if (!name || !id) {
        return res.status(400).json({ error: 'Invalid parameters' });
    }

    const idi = (+id) + 1;
    const sql = `SELECT id FROM ${name} WHERE id = ?`;
    con.query(sql, [idi], (err, ress) => {
        if (err) {
            console.error('Error selecting nav-data:', err);
            return res.status(500).json({ error: 'Database error', details: err.message });
        }
        if (ress.length > 0) return res.send('1');
        else return res.send('0');
    });
});

app.post('/content/navhead', (req, res) => {
    const link = req.body.link;
    const sql = `SELECT name, link FROM sub_header WHERE featured_id = (SELECT featured_id FROM sub_header WHERE link = ?)`;

    con.query(sql, [link], (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Internal Server Error" });
        }
        res.json(result);
    });
});


//update page data
app.post('/content/pagedata/update', async (req, res) => {
    try {
        if (!req.session.login || !req.session.admin) {
            return res.status(403).json({ error: 'Unauthorized access' });
        }

        var { content_address, data } = req.body;

        // Validate required parameters
        if (!content_address || !data) {
            return res.status(400).json({ error: 'Invalid parameters' });
        }

        var data = {data: data};

        const done = await updateData(content_address, data);

        if (!done) {
            return res.status(500).json({ error: 'Error updating data in MongoDB' });
        }

        res.json({ message: 'Update successful' });

    } catch (error) {
        console.error('Server Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});




module.exports = app;