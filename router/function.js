const crypto = require('crypto');
const con = require('../mysqlcon');
const { MongoClient, ObjectId } = require('mongodb');

con.connect((err) => { if (err) { console.error('Error connecting to MySQL:', err); return; } });
// return string base big random number
function geHaNum(s) {
    s = s + "454";
    const hash = crypto.createHash('sha256').update(s).digest('hex');
    return parseInt(hash.slice(0, 15), 16);
}
// chake login or not
async function checkLogin(req, res) {
    if (req.cookies.login == true) {
        const email = req.cookies.email;
        const query = "SELECT id, email, username, passwd FROM users WHERE email = ?";
        try {
            const [results] = await con.promise().query(query, [email]);
            if (results.length > 0) {
                const user = results[0];
                const skey = geHaNum(user.passwd);
                if (skey == req.cookies.skey) {
                    req.session.login = true;
                    req.session.idd = user.id;
                    req.session.email = user.email;
                    req.session.username = user.username;
                    return true;
                } else {
                    req.session.login = false;
                    req.session.destroy();
                    res.clearCookie('login');
                    res.clearCookie('email');
                    res.clearCookie('skey');
                    return false;
                }
            } else {
                return false; // No user found with that email
            }
        } catch (err) {
            console.error('Error executing query:', err);
            return false;
        }
    } else {
        return false;
    }
}
// string data to convert format date
function dateformate(dateString) {
    // Create a Date object from the input date string
    const date = new Date(dateString);
    // Extract the year, month, and day
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed, so add 1
    const day = String(date.getDate()).padStart(2, '0'); // Get day and pad with zero
    // Return the formatted date as YYYY-MM-DD
    return `${year}-${month}-${day}`;
}
// set user login
async function setLogin(idd, req) {
    var str = "SELECT id, fullname, email, username, userurl FROM users WHERE id = ?";
    con.query(str, [idd], (err, results) => {
        if (err) { console.error('Error executing query:', err); return; }
        var email = results[0].email;
        var idd = results[0].id;
        req.session.login = true;
        req.session.idd = idd;
        req.session.email = email;
        req.session.userurl = results[0].userurl;
        req.session.username = results[0].username;
        req.session.fullname = results[0].fullname;
    });
}




const uri = 'mongodb://localhost:27017';
const dbName = 'dsatrainer';

async function insertData(data) {
    const client = new MongoClient(uri);

    try {
        await client.connect();

        const db = client.db(dbName);
        const collection = db.collection('content'); // Collection name

        const result = await collection.insertOne(data);

        return result.insertedId.toString(); // Return inserted document ID

    } catch (err) {
        console.error('Error:', err);
        return null; // Return null if an error occurs
    } finally {
        await client.close();
    }
}

async function givemedata(id) {
    const client = new MongoClient(uri);

    try {
        await client.connect();

        const db = client.db(dbName);
        const collection = db.collection('content'); // Collection name

        let query;

        // Check if id is a valid 24-character hexadecimal ObjectId
        if (typeof id === 'string' && ObjectId.isValid(id) && id.length === 24) {
            query = { _id: new ObjectId(id) }; // Convert to ObjectId
        } else {
            query = { _id: id }; // Treat as a string
        }

        const result = await collection.findOne(query);

        return result; // Return result if found, otherwise return null

    } catch (err) {
        console.error('Error:', err);
        return null; // Return null if an error occurs
    } finally {
        await client.close();
    }
}


async function updateData(id, data) {
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection('content'); // Collection name

        // Determine the query based on whether id is a valid ObjectId
        const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };

        const result = await collection.updateOne(query, { $set: data });

        return result.modifiedCount > 0; // Returns true if an update was made

    } catch (err) {
        console.error('Error:', err);
        return null; // Return null if an error occurs
    } finally {
        await client.close();
    }
}




module.exports = {
    geHaNum,
    checkLogin,
    dateformate,
    setLogin,
    insertData,
    givemedata,
    updateData
}