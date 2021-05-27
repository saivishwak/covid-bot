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

const url = "https://covidbengaluru.com/data/covidbengaluru.com/bed_data.json?_=f1d3163_20210505191632323";
const urlShow = "https://covidbengaluru.com";

let cityName = "Bengaluru";
let city;
let state = "Karnataka";
let mainDataArr = [];
let mainDataObj = {};
let mainDataObjFormatted = {};

const cleanData = (mainDataArr) => {
  let formattedArr = [];
  return mainDataArr;
};

// DB connection initialize
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("**** Mongo DB is connected ****");

  axios(url)
    .then((response) => {
      console.log(Object.keys(response));
      console.log("length of Data: ", response.data.length);
      for (let i = 0; i < response.data.length; i++) {
        let dataObj = {};
        let city = response.data[i].district != null ? response.data[i].district.toLowerCase() : cityName;
        // if (response.data[i].district.toLowerCase() == city){
        dataObj["Hospital Name"] = response.data[i].hospital_name;
        dataObj["Phone"] = response.data[i].hospital_phone != null ? response.data[i].hospital_phone : "N/A";
        dataObj["Location"] = response.data[i].hospital_address;
        dataObj["ICU Beds"] = response.data[i].available_icu_beds_with_ventilator;
        dataObj["Oxygen Beds"] = response.data[i].available_beds_with_oxygen;
        dataObj["Regular Beds"] = response.data[i].available_beds_without_oxygen;
        dataObj["Last Checked"] = response.data[i].last_updated_on != 0 ? moment(response.data[i].last_updated_on).format("MMMM Do YYYY, h:mm a") : moment().format("MMMM Do YYYY, h:mm a");
        dataObj["Zone"] = response.data[i].area != null ? response.data[i].area : response.data[i].pincode;
        if (!mainDataObjFormatted[city[0].toUpperCase() + city.substring(1, city.length)]) {
          mainDataObjFormatted[city[0].toUpperCase() + city.substring(1, city.length)] = [];
        } else {
          mainDataObjFormatted[city[0].toUpperCase() + city.substring(1, city.length)].push(dataObj);
        }
        // }
      }
      console.log(Object.keys(mainDataObjFormatted));
      //console.log(mainDataObjFormatted);
      //return;
      let itr = 0;
      for (let keys in mainDataObjFormatted) {
        hospitalDataMongo.findOne({ "city/district": keys }, (err, dbResult) => {
          if (err) {
            console.log(err);
          } else {
            mainDataObj = {};
            //const formattedMainData = cleanData(mainDataArr);
            console.log("**** CITY/DISTRICT *****", keys);
            city = keys;
            mainDataObj["data"] = mainDataObjFormatted[keys];
            mainDataObj["city/district"] = keys;
            mainDataObj["resources"] = [urlShow];
            if (dbResult) {
              console.log("*** DATA ALREADY EXISTS *****", keys);
              hospitalDataMongo.findOneAndReplace({ "city/district": keys }, mainDataObj, null, (err, dBresult) => {
                if (err) {
                  console.log(err);
                } else {
                  console.log("*** Updated Docs ***", keys);
                  itr += 1;
                  if (itr == Object.keys(mainDataObjFormatted).length) {
                    db.close();
                  }
                }
              });
            } else {
              console.log("**** DATA DOESNOT EXISTS *****", keys);
              const dataUpload = new hospitalDataMongo(mainDataObj);
              dataUpload.save((err, result) => {
                if (err) {
                  console.log(err);
                } else {
                  console.log("**** Inserted *****", keys);
                  itr += 1;
                  if (itr == Object.keys(mainDataObjFormatted).length) {
                    db.close();
                  }
                }
              });
            }
          }
        });
      }
    })
    .catch(console.error);
});
