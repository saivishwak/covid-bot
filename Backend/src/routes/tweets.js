/*  --------- Dialogflow Routes for Dialogflow AI ------------
    Development done in vsCode and formatting with prettier
    This source code belongs to ByteBook.co Any use of this code outside ByteBook.co is not
    allowed.
*/

// Import libraries
const express = require("express");
const router = express.Router();

// Util imports
const connection = require("../utils/mysqlDb.js");
const logger = require("../utils/logger.js");

// twitter redirect Endpoint
router.get("/api/tweets", (req, res) => {
    logger("****** tweets get api called ******")
  /* API route which redirects twitter */
    const stringID = req.query.q;
    const sqlQuery = "SELECT * FROM twilio.shortUrls WHERE (stringID = " + `'${stringID}');`
    connection.query(sqlQuery, (err, sqlResult)=>{
        if (err){
            logger(err);
            return res.status(500);
        }
        else{
            if (sqlResult.length > 0){
                return res.status(200).redirect(sqlResult[0].urlString);
            }
            else{
                logger("Url Not found")
                return res.status(404).send("Not Found");
            }
        }
    })
});

module.exports = router;