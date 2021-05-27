/*  --------- MysQl for Dialogflow AI ------------
    Development done in vsCode and formatting with prettier
    This source code belongs to ByteBook.co Any use of this code outside ByteBook.co is not
    allowed.
*/

// Import libraries
const mysql = require("mysql2");

// MysQl
const connection = mysql.createConnection({
  host: "",
  user: "local",
  password: "",
  database: "twilio",
  port: 3306,
});

module.exports = connection;
