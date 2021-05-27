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

const url = "https://covidbeds.info/hyderabad/";

let city = "Hyderabad";
let state = "Telangana";
let mainDataArr = [];
let mainDataObj = {};
mainDataObj["city"] = city;
mainDataObj["resources"] = [url]
const stop_words = ["available","maybe", "may", "be", "full", "beds"];

function remove_stopwords(str) {
  res = [];
  words = str.split(" ");
  for (i = 0; i < words.length; i++) {
    word_clean = words[i].split(".").join("");
    if (!stop_words.includes(word_clean)) {
      res.push(word_clean);
    }
  }
  return res.join(" ");
}

const cleanData = (mainDataArr) => {
  let formattedArr = [];
  for (let i = 0; i < mainDataArr.length; i++) {
    //Clean and replace empty string with 1 least case avaialble data
    mainDataArr[i]["Regular Beds"] = (remove_stopwords(mainDataArr[i]["Regular Beds"].toLowerCase().replace(/[^a-zA-Z0-9]/g, " ")).trim() == "")? "1":remove_stopwords(mainDataArr[i]["Regular Beds"].toLowerCase().replace(/[^a-zA-Z0-9]/g, " ")).trim();
    mainDataArr[i]["Oxygen Beds"] = (remove_stopwords(mainDataArr[i]["Oxygen Beds"].toLowerCase().replace(/[^a-zA-Z0-9]/g, " ")).trim() == "")? "1":remove_stopwords(mainDataArr[i]["Oxygen Beds"].toLowerCase().replace(/[^a-zA-Z0-9]/g, " ")).trim();
    mainDataArr[i]["ICU Beds"] = (remove_stopwords(mainDataArr[i]["ICU Beds"].toLowerCase().replace(/[^a-zA-Z0-9]/g, " ")).trim() == "")? "1":remove_stopwords(mainDataArr[i]["ICU Beds"].toLowerCase().replace(/[^a-zA-Z0-9]/g, " ")).trim();

    //make full as 0
    mainDataArr[i]["Regular Beds"] = (mainDataArr[i]["Regular Beds"].toLowerCase() == "full")? "0":mainDataArr[i]["Regular Beds"];
    mainDataArr[i]["Oxygen Beds"] = (mainDataArr[i]["Oxygen Beds"].toLowerCase() == "full")? "0":mainDataArr[i]["Oxygen Beds"];
    mainDataArr[i]["ICU Beds"] = (mainDataArr[i]["ICU Beds"].toLowerCase() == "full")? "0":mainDataArr[i]["ICU Beds"];

    //make na as 0
    mainDataArr[i]["Regular Beds"] = (mainDataArr[i]["Regular Beds"].toLowerCase() == "na" || "n a" || "n/a")? "-1":mainDataArr[i]["Regular Beds"];
    mainDataArr[i]["Oxygen Beds"] = (mainDataArr[i]["Oxygen Beds"].toLowerCase() == "na" || "n a" || "n/a")? "-1":mainDataArr[i]["Oxygen Beds"];
    mainDataArr[i]["ICU Beds"] = (mainDataArr[i]["ICU Beds"].toLowerCase() == "na" || "n a" || "n/a")? "-1":mainDataArr[i]["ICU Beds"];

    // if (mainDataArr[i]["Last Checked"].length > 0) {
    //   try {
    //     mainDataArr[i]["Last Checked"] = moment(new Date(mainDataArr[i]["Last Checked"])).format("dddd, MMMM Do YYYY, h:mm a");
    //   } catch (err) {
    //     console.log("Time format error", i);
    //   }
    // }
  }
  return mainDataArr;
};

// DB connection initialize
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("**** Mongo DB is connected ****");


axios(url)
  .then((response) => {
    let headerTagsArr = [];
    let tableDataArr = [];
    const html = response.data;
    const $ = cheerio.load(html);
    const tableTag = $("#footable_parent_188 table");
    const headerTable = $("#footable_parent_188 table tr");
    const headerTags = headerTable.find("th");
    headerTags.each(function () {
      const tagName = $(this).text();
      headerTagsArr.push(tagName);
    });

    const tableRow = tableTag.find("tbody");
    tableRow.find("tr").each(function (key, val) {
      let mainData = {};
      $(this)
        .find("td")
        .each(function (key, val) {
          //console.log($(this).text());
          mainData[headerTagsArr[key]] = $(this).text();
        });
      mainDataArr.push(mainData);
    });

    const formattedMainData = cleanData(mainDataArr);
    console.log(mainDataArr[1]);
    console.log(formattedMainData[1]);
    mainDataObj["data"] = formattedMainData;
    hospitalDataMongo.findOne({"city": city}, (err, dbResult)=>{
      if (err){
        console.log(err);
      }
      else{
        if (dbResult){
          console.log("*** DATA ALREADY EXISTS *****")
          hospitalDataMongo.findOneAndReplace({"city": city}, mainDataObj, null, (err, dBresult)=>{
            if (err){
              console.log(err);
            }
            else{
              console.log("*** Updated Docs ***")
            }
          })
        }
        else{
          console.log("**** DATA DOESNOT EXISTS *****")
          const dataUpload =  new hospitalDataMongo(mainDataObj);
              dataUpload.save((err, result)=>{
                if (err){
                  console.log(err);
                }
                else{
                  console.log("**** Inserted *****", result)
                }
              })
        }
      }
    })
    
  })
  .catch(console.error);
});