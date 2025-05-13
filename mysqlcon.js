// Import the mysql2 library
const mysql = require('mysql2');

// Create a connection to the database
const con = mysql.createConnection({
  host: 'localhost',  // Your MySQL server host
  user: 'code',       // Your MySQL username
  password: '12345678',       // Your MySQL password
  database: 'dsalogin' // Your database name
});
module.exports = con;