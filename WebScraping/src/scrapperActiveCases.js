/*  --------- WebScrapper for Dialogflow AI ------------
    Development done in vsCode and formatting with prettier
    This source code belongs to ByteBook.co Any use of this code outside ByteBook.co is not
    allowed.
*/

// Import libraries
const axios = require("axios");
const cheerio = require("cheerio");
const moment = require("moment");

// Utils Import
const { db } = require("./mongoDb.js");
const hospitalDataMongo = require("./mongoDb.js").schema;
const toalCountDataMongo = require("./mongoDb.js").totalCountSchema;

const url = "https://www.mohfw.gov.in/";

// DB connection initialize
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("**** Mongo DB is connected ****");

  axios(url)
    .then((response) => {
      const html = response.data;
      const $ = cheerio.load(html);
      let obj = { id: "1", Active: 0, Discharged: 0, Deaths: 0 };
      const headTag = $("#site-dashboard strong");
      let str = headTag.text().replace(/\s/g, "");
      let index = str.indexOf("Active");
      index += 6;
      obj["Active"] = parseInt(str.substring(index, str.indexOf("(")));
      index = str.indexOf("Discharged");
      index += 10;
      let temp = str.substring(index, str.length).indexOf("(");
      obj["Discharged"] = parseInt(str.substring(index, index + temp));
      index = str.indexOf("Deaths");
      index += 6;
      temp = str.substring(index, str.length).indexOf("(");
      obj["Deaths"] = parseInt(str.substring(index, index + temp));
      console.log(obj);
      toalCountDataMongo.replaceOne({ id: "1" }, obj, (err, result) => {
        if (err) {
          console.log(err);
        } else {
          console.log("Updated");
          db.close();
        }
      });
    })
    .catch(console.error);
});
