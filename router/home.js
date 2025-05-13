const express = require('express');
const app = express.Router();
const con = require('../mysqlcon');
// connecting database
con.connect((err) => { if (err) { console.error('Error connecting to MySQL:', err); return; } });



// get all header list
app.get('/headerlist', (req, res) => {
    const sql = `SELECT * FROM headerlist ORDER BY id ASC`; // Ensures correct order

    con.query(sql, (err, result) => {
        if (err) {
            console.error('Error fetching headerlist:', err);
            return res.status(500).json({ error: 'Database query failed', details: err.message });
        }

        if (result.length === 0) {
            return res.json({ message: 'No records found' });
        }

        res.json(result);
    });
});

// update header list
app.post('/headerlist', (req, res) => {

    // Check if user is logged in and is an admin
    if (req.session.login && req.session.admin) {

        const headerList = req.body.headerList; // Expecting an array of { title, url }

        if (!Array.isArray(headerList) || headerList.length === 0) {
            return res.status(400).json({ error: 'Invalid or empty header list' });
        }

        // Convert array into SQL values format
        const values = headerList.map(item => [item.title, item.url]);

        // First, delete all records from the table
        const deleteQuery = `DELETE FROM headerlist`;

        con.query(deleteQuery, (deleteErr) => {
            if (deleteErr) {
                console.error('Error clearing headerlist:', deleteErr);
                return res.status(500).json({ error: 'Database error while clearing table' });
            }

            // Insert new values
            const insertQuery = `INSERT INTO headerlist (title, url) VALUES ${values.map(() => '(?, ?)').join(', ')}`;
            const flatValues = values.flat(); // Convert [[a, b], [c, d]] -> [a, b, c, d]

            con.query(insertQuery, flatValues, (insertErr, insertResult) => {
                if (insertErr) {
                    console.error('Error inserting headerlist:', insertErr);
                    return res.status(500).json({ error: 'Database error while inserting' });
                }
                res.json({ message: 'done', insertedRows: insertResult.affectedRows });
            });
        });
    } else {
        res.status(403).json({ error: 'Unauthorized access' });
    }
});

// get all featured headers
app.get('/featured', (req, res) => {
    var sql = `
        SELECT 
            f.id AS featured_id, f.title AS featured_title,
            s.id AS sub_id, s.name AS sub_name, s.slogan AS sub_slogan, s.link AS sub_link
        FROM featured f
        LEFT JOIN sub_header s ON f.id = s.featured_id
        ORDER BY f.id, s.id;
    `;

    con.query(sql, (err, result) => {
        if (err) {
            console.error({ error: 'Error fetching featured headers and sub-headers', details: err });
            return res.status(500).json({ error: 'Database error' });
        }

        if (result.length === 0) {
            return res.json({ message: 'No featured headers found' });
        }

        // Grouping the result into a structured format
        const featuredData = {};

        result.forEach(row => {
            const { featured_id, featured_title, sub_id, sub_name, sub_slogan, sub_link } = row;

            if (!featuredData[featured_id]) {
                featuredData[featured_id] = {
                    id: featured_id,
                    title: featured_title,
                    sub_headers: []
                };
            }

            if (sub_id) { // If a sub-header exists, push it
                featuredData[featured_id].sub_headers.push({
                    id: sub_id,
                    name: sub_name,
                    slogan: sub_slogan,
                    link: sub_link
                });
            }
        });

        res.json(Object.values(featuredData));
    });
});

// add new featured header
app.post('/featured/header', (req, res) => {
    // Check if user is logged in and is an admin
    if (req.session.login && req.session.admin) {
        const { title } = req.body;
        if (!title) {
            return res.status(400).json({ error: 'Invalid title' });
        }

        const sql = `INSERT INTO featured (title) VALUES (?)`;
        con.query(sql, [title], (err, result) => {
            if (err) {
                console.error({ error: 'Error inserting featured header', details: err });
                return res.status(500).json({ error: 'Database error' });
            }
            res.json({ message: 'done', insertedId: result.insertId });
        });
    } else {
        res.status(403).json({ error: 'Unauthorized access' });
    }
});

//  Clean URL
const cleanUrl = (url) => {
    return url.replace(/^https?:\/\//, '').replace(/^127\.0\.0\.1:3000\//, '');
};

// add new sub header
app.post('/featured/subheader', (req, res) => {
    // Check if user is logged in and is an admin
    if (req.session.login && req.session.admin) {
        var { featuredId, name, slogan, link } = req.body;
        link = cleanUrl(link);
        if (!featuredId || !name || !slogan || !link) {
            return res.status(400).json({ error: 'Invalid parameters' });
        }

        const sql = `INSERT INTO sub_header (featured_id, name, slogan, link) VALUES (?, ?, ?, ?)`;
        con.query(sql, [featuredId, name, slogan, link], (err, result) => {
            if (err) {
                console.error({ error: 'Error inserting sub-header', details: err });
                return res.status(500).json({ error: 'Database error' });
            }
            const str = `id INT PRIMARY KEY AUTO_INCREMENT,
             title VARCHAR(255),
             nav_title VARCHAR(255),
             description VARCHAR(255),
             keyword VARCHAR(255),
             content_address VARCHAR(255)`;

            const sql1 = `CREATE TABLE IF NOT EXISTS \`${featuredId + '' + name}_nav\` (${str})`;
            con.query(sql1, (err) => {
                if (err) { console.error({ error: 'Error creating table', details: err }); return; }
                res.json({ message: 'done', insertedId: result.insertId });
                return;
            });
        });
    } else {
        res.status(403).json({ error: 'Unauthorized access' });
    }
});

// update featured header
app.post('/featured/update', (req, res) => {
    // Check if user is logged in and is an admin
    if (req.session.login && req.session.admin) {
        const { id, title } = req.body;
        if (!id || !title) {
            return res.status(400).json({ error: 'Invalid parameters' });
        }

        const sql = `UPDATE featured SET title = ? WHERE id = ?`;
        con.query(sql, [title, id], (err, result) => {
            if (err) {
                console.error({ error: 'Error updating featured header', details: err });
                return res.status(500).json({ error: 'Database error' });
            }
            res.json({ message: 'done', updatedId: id });
        });
    } else {
        res.status(403).json({ error: 'Unauthorized access' });
    }
});

// update sub header
app.post('/featured/subheader/update', (req, res) => {
    // Check if user is logged in and is an admin
    if (req.session.login && req.session.admin) {
        var { id, name, slogan, link } = req.body;
        link = cleanUrl(link);
        if (!id || !name || !slogan || !link) {
            return res.status(400).json({ error: 'Invalid parameters' });
        }

        const sql = `SELECT featured_id, name FROM sub_header WHERE id = ?`;
        con.query(sql, [id], (err, result) => {
            if (err) {
                console.error({ error: 'Error fetching sub-header', details: err });
                return res.status(500).json({ error: 'Database error' });
            }
            if (result.length === 0) {
                return res.status(404).json({ error: 'Sub-header not found' });
            }
            const { featured_id, name: oldName } = result[0];
            const sql = `UPDATE sub_header SET name = ?, slogan = ?, link = ? WHERE id = ?`;
            con.query(sql, [name, slogan, link, id], (err, result) => {
                if (err) {
                    console.error({ error: 'Error updating sub-header', details: err });
                    return res.status(500).json({ error: 'Database error' });
                }
                const sql = `ALTER TABLE \`${featured_id + '' + oldName}_nav\` RENAME TO \`${featured_id + '' + name}_nav\``;
                con.query(sql, (err) => {
                    if (err) { console.error({ error: 'Error renaming table', details: err }); return; }
                    res.json({ message: 'done', updatedId: id });
                });
            });
        });
    } else {
        res.status(403).json({ error: 'Unauthorized access' });
    }
});

// delete sub header
app.post('/featured/subheader/delete', (req, res) => {
    // Check if user is logged in and is an admin
    if (req.session.login && req.session.admin) {
        const id = req.body.id;
        if (!id) {
            return res.status(400).json({ error: 'Invalid ID' });
        }
        const sql1 = `SELECT featured_id, name FROM sub_header WHERE id = ?`;
        con.query(sql1, [id], (err, result) => {
            if (err) {
                console.error({ error: 'Error fetching sub-header', details: err });
                return res.status(500).json({ error: 'Database error' });
            }
            if (result.length === 0) {
                return res.status(404).json({ error: 'Sub-header not found' });
            }
            const { featured_id, name } = result[0];
            const sql = `DELETE FROM sub_header WHERE id = ?`;
            con.query(sql, [id], (err, result) => {
                if (err) {
                    console.error({ error: 'Error deleting sub-header', details: err });
                    return res.status(500).json({ error: 'Database error' });
                }
                const sql = `DROP TABLE \`${featured_id + '' + name}_nav\``;
                con.query(sql, (err) => {
                    if (err) { console.error({ error: 'Error deleting table', details: err }); return; }
                    res.json({ message: 'done', deletedId: id });
                });
            });
        });
    } else {
        res.status(403).json({ error: 'Unauthorized access' });
    }
});

// delete featured header
app.post('/featured/delete', (req, res) => {
    // Check if user is logged in and is an admin
    if (req.session.login && req.session.admin) {
        const id = req.body.id;
        if (!id) {
            return res.status(400).json({ error: 'Invalid ID' });
        }

        // First, delete all sub-headers linked to this featured header
        const deleteSubHeaders = `DELETE FROM sub_header WHERE featured_id = ?`;

        con.query(deleteSubHeaders, [id], (subErr, subResult) => {
            if (subErr) {
                console.error({ error: 'Error deleting sub-headers', details: subErr });
                return res.status(500).json({ error: 'Database error while deleting sub-headers' });
            }

            // Now, delete the featured header
            const deleteFeatured = `DELETE FROM featured WHERE id = ?`;

            con.query(deleteFeatured, [id], (featuredErr, featuredResult) => {
                if (featuredErr) {
                    console.error({ error: 'Error deleting featured header', details: featuredErr });
                    return res.status(500).json({ error: 'Database error while deleting featured header' });
                }
                res.json({ message: 'Deleted successfully', deletedFeaturedId: id });
            });
        });
    } else {
        res.status(403).json({ error: 'Unauthorized access' });
    }
});

// move sub header
app.post('/featured/subheader/move', (req, res) => {
    // Check if user is logged in and is an admin
    if (req.session.login && req.session.admin) {
        const { id, featured_id } = req.body;
        if (!id || !featured_id) {
            return res.status(400).json({ error: 'Invalid parameters' });
        }

        const sql = `SELECT id FROM sub_header WHERE id = ?`;
        con.query(sql, [id], (err, result) => {
            if (err) {
                console.error({ error: 'Error fetching sub-header', details: err });
                return res.status(500).json({ error: 'Database error' });
            }

            if (result.length === 0) {
                return res.status(404).json({ error: 'Sub-header not found' });
            }
            const sql = `UPDATE sub_header SET featured_id = ? WHERE id = ?`;
            con.query(sql, [featured_id, id], (err, result) => {
                if (err) {
                    console.error({ error: 'Error updating sub-header', details: err });
                    return res.status(500).json({ error: 'Database error' });
                }
                res.json({ message: 'done', updatedId: id });
            });
        });
    } else {
        res.status(403).json({ error: 'Unauthorized access' });
    }
});

// reorder featured header
app.post('/featured/header/customize_list', async (req, res) => {
    // Check if user is logged in and is an admin
    if (req.session.login && req.session.admin) {
        const { idMappings } = req.body; // Expecting { oldId1: newId1, oldId2: newId2 }

        if (!idMappings || typeof idMappings !== 'object') {
            return res.status(400).json({ error: 'Invalid ID mappings provided' });
        }

        const connection = await con.getConnection(); // Get a connection from pool
        try {
            await connection.beginTransaction(); // Start transaction

            // 1. Create a temporary table to hold ID mappings
            await connection.query(`CREATE TEMPORARY TABLE id_map (old_id INT, new_id INT)`);

            // 2. Insert mappings into temporary table
            const values = Object.entries(idMappings).map(([oldId, newId]) => [oldId, newId]);
            await connection.query(`INSERT INTO id_map (old_id, new_id) VALUES ?`, [values]);

            // 3. Update `sub_header` table first
            await connection.query(`
            UPDATE sub_header s
            JOIN id_map m ON s.featured_id = m.old_id
            SET s.featured_id = m.new_id
        `);

            // 4. Update `featured` table with new IDs
            await connection.query(`
            UPDATE featured f
            JOIN id_map m ON f.id = m.old_id
            SET f.id = m.new_id
        `);

            // 5. Drop the temporary table
            await connection.query(`DROP TEMPORARY TABLE id_map`);

            // 6. Commit the transaction
            await connection.commit();
            res.json({ success: true, message: 'IDs updated successfully' });
        } catch (error) {
            await connection.rollback();
            res.status(500).json({ error: 'Database update failed', details: error.message });
        } finally {
            connection.release(); // Release connection back to pool
        }
    } else {
        res.status(403).json({ error: 'Unauthorized access' });
    }
});

//reorder sub header
app.post('/featured/subheader/customize_list', async (req, res) => {
    // Check if user is logged in and is an admin
    if (req.session.login && req.session.admin) {
        const { featured_id, subheaders } = req.body;
        // Expected format:
        // { featured_id: 5, subheaders: [{ id: 12, index: 0 }, { id: 8, index: 1 }, { id: 3, index: 2 }] }

        if (!featured_id || !Array.isArray(subheaders) || subheaders.length === 0) {
            return res.status(400).json({ error: 'Invalid input. Provide featured_id and subheaders list.' });
        }

        const connection = await con.getConnection(); // Get a connection from pool
        try {
            await connection.beginTransaction(); // Start transaction

            const existingIds = subheaders.map(subheader => ({ id: subheader.id }));

            if (existingIds.length === 0) {
                return res.status(404).json({ error: 'No subheaders found for this featured_id' });
            }

            existingIds.sort((a, b) => a.id - b.id);

            let newId = existingIds[0].id; // Smallest available ID from `sub_header`

            // 3. Update each subheader with new ID
            for (const subheader of subheaders) {
                await connection.query(
                    `UPDATE sub_header SET id = ? WHERE id = ? AND featured_id = ?`,
                    [newId, subheader.id, featured_id]
                );
                newId++; // Increment ID for the next subheader
            }

            await connection.commit();
            res.json({ success: true, message: 'Subheader IDs updated based on index order' });
        } catch (error) {
            await connection.rollback();
            res.status(500).json({ error: 'Database update failed', details: error.message });
        } finally {
            connection.release(); // Release connection
        }
    } else {
        res.status(403).json({ error: 'Unauthorized access' });
    }
});

// check if sub header link exists or not
app.post('/featured/subheader/link_exists', async (req, res) => {
    // Check if user is logged in and is an admin
    if (req.session.login && req.session.admin) {
        const { link } = req.body;

        if (!link) {
            return res.status(400).json({ error: 'Link is required' });
        }

        try {
            const [result] = await con.query(
                `SELECT COUNT(*) AS count FROM sub_header WHERE link = ?`,
                [link]
            );

            const exists = result[0].count > 0; // If count > 0, the link exists

            res.json({ exists });
        } catch (error) {
            console.error('Database error:', error);
            res.status(500).json({ error: 'Database query failed', details: error.message });
        }
    } else {
        res.status(403).json({ error: 'Unauthorized access' });
    }
});


module.exports = app;
















module.exports = app;