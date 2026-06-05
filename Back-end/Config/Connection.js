require('dotenv').config();
const mysql = require("mysql2");

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
});

pool.getConnection((err, conn) => {
    if (err) {
        console.error("Error connecting to database: " + err.message);
        return;
    }
    console.log("Connected to database successfully");
    conn.release();
});

module.exports = pool.promise();