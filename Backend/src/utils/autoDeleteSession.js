/*  --------- autoDeleteSession function for Dialogflow AI ------------
    Development done in vsCode and formatting with prettier
    This source code belongs to ByteBook.co Any use of this code outside ByteBook.co is not
    allowed.
*/
// Import libraries
const moment = require("moment");

// MysQl
const connection = require("./mysqlDb");

// Main function for interval call
const intervalFunc = () => {
  console.log("Running Auto Delete Session Script");
  // Create Current date object
  const dateTime = moment();
  const sqlQuery = "SELECT * FROM dialogflowsession;";
  connection.query(sqlQuery, (err, res) => {
    if (err) {
      console.log(err);
      return err;
    }
    for (let i = 0; i < res.length; i++) {
      const querDateTime = moment(res[i].timestamp);
      if (dateTime.diff(querDateTime, "minutes") >= 10) {
        const sqlQuery = "DELETE FROM dialogflowsession WHERE idnew_table = " + `${res[i].idnew_table};`;
        connection.query(sqlQuery, (error, result) => {
          if (error) {
            console.log(error);
            return error;
          }
          console.log(`Deleted Entry : ${res[i]}`);
        });
      }
    }
  });
};

// call the function for every 10 mins
setInterval(intervalFunc, 600000);
