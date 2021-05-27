/*  --------- Dialogflow Intents for Dialogflow AI ------------
    Development done in vsCode and formatting with prettier
    This source code belongs to ByteBook.co Any use of this code outside ByteBook.co is not
    allowed.
*/

// Import libraries
const connection = require("./mysqlDb");
var Twit = require("twit");
const moment = require("moment");
const uuid = require("uuid");

// Utils Import
const hospitalDataMongo = require("./mongoDb.js").schema;
const toalCountDataMongo = require("./mongoDb.js").totalCountSchema;
const logger = require("./logger.js");

//Twitter-config
var T = new Twit({
  consumer_key: "*****",
  consumer_secret: "*****",
  access_token: "******",
  access_token_secret: "******",
  timeout_ms: 60 * 1000, // optional HTTP request timeout to apply to all requests.
  strictSSL: true, // optional - requires SSL certificates to be valid.
});

//Load cities Header list
let availableCities = [];
hospitalDataMongo.find({}, (err, dbResultHeader) => {
  if (err) {
    return err;
  }
  if (dbResultHeader) {
    for (let i = 0; i < dbResultHeader.length; i++) {
      availableCities.push(dbResultHeader[i]["city/district"]);
    }
  }
  logger("Loaded CitiesHeader");
});

//Helper Function
const formatStrFromObj = (object, limit, startIndex) => {
  let array = object.data;
  let resources = object.resources;
  let finalStr = "";
  logger("***** OBJECT LENGTH ****** " + array.length);
  logger("***** Start Index ****** " + startIndex);

  let finalIndex;
  if (limit + startIndex > array.length) {
    finalIndex = array.length;
  } else {
    finalIndex = limit + startIndex;
  }
  if (array.length == 0) {
    return "Sorry! this location currently has no data 🙁";
  }
  logger("***** End Index ****** " + finalIndex);
  finalStr += "If you want more data, reply *Show More* or else you can reply *Cancel* (to stop your session), *Available beds* (for another query). \n";
  finalStr += "\n*Note*: Please do call the hospital before visit. \n";
  finalStr += "------------------------- \n";
  for (let i = startIndex; i < finalIndex; i++) {
    finalStr += "*Hospital Name*: " + array[i]["Hospital Name"] + "," + "\n";
    finalStr += "*Location*: " + array[i]["Location"] + "," + "\n";
    finalStr += "*Regular Beds*: " + array[i]["Regular Beds"] + "," + "\n";
    finalStr += "*Oxygen Beds*: " + array[i]["Oxygen Beds"] + "," + "\n";
    finalStr += "*ICU Beds*: " + array[i]["ICU Beds"] + "," + "\n";
    finalStr += "*Phone*: " + array[i]["Phone"] + "," + "\n";
    finalStr += "*Last Checked*: " + array[i]["Last Checked"] + "," + "\n";
    finalStr += "------------------------- \n";
  }
  finalStr += "Resources :";
  for (let i = 0; i < resources.length; i++) {
    finalStr += resources[i] + " ";
  }
  finalStr += "\n";
  return finalStr;
};

const formatCitiesArray = (array) => {
  array.sort();
  let string = "\n \n";
  for (let i = 0; i < array.length; i++) {
    string += `${array[i]}` + ", ";
  }
  string += "\n";
  return string.substring(0, string.length - 1) + "\n\n";
};

function getAvailableBeds(agent) {
  return new Promise((resolve, reject) => {
    logger("****** getAvailableBeds intent triggered ******");

    /* extract the parameters from agent */
    const parameters = agent.parameters;
    logger("parameters", parameters);
    let city;
    city = parameters.location.location == null ? parameters.location : parameters.location.location.city;
    if (city == "") {
      city = "null";
    }
    logger("**** SELECTED CITY ******", city);
    city = city.toLowerCase();
    city = city[0].toUpperCase() + city.substring(1, city.length);
    const bedType = parameters.bedType;
    const messagesLimit = 3;
    let indexValue;
    /* extract agent session id from params */
    const agentSession = agent.session.slice(agent.session.length - 36);
    logger("******* agent session ******** ", agentSession);

    /* SQL query to fet dialoflow sessoin data */
    const sqlQuery = "SELECT * FROM dialogflowsession WHERE (sessionID = " + `'${agentSession}');`;

    connection.query(sqlQuery, (err, sqlResult) => {
      if (err) {
        return reject(err);
      } else {
        if (sqlResult.length > 0) {
          indexValue = sqlResult[0].counter_variable;
          /* Check if query is not in avaialbleCities */
          if (!availableCities.includes(city)) {
            logger("**** CIty not in list ******");

            const idDialogContext = "0c5fe49a-e621-490f-852f-16796c18c645_id_dialog_context";
            const nameDialogContext = "getavailablebeds_dialog_context";
            const updatedParameters = {
              bedType: bedType,
              location: "",
            };
            parameterContext = "getavailablebeds_dialog_params_location";
            agent.context.set({
              name: idDialogContext,
              parameters: updatedParameters,
              lifespan: 1,
            });
            agent.context.set({
              name: nameDialogContext,
              parameters: updatedParameters,
              lifespan: 1,
            });
            agent.context.set({
              name: parameterContext,
              parameters: updatedParameters,
              lifespan: 1,
            });
            //agent.setFollowupEvent("getAvailableBeds");
            return resolve(agent.add(`I am sorry, We currently support Cities/Districts mentioned below. ${formatCitiesArray(availableCities)}*Please respond a different location!*`));

            /* SQL query to delete the dialoflow session */
            /*
            const sqlQuery = "DELETE FROM dialogflowsession WHERE (sessionID = " + `'${agentSession}');`;

            connection.query(sqlQuery, (err, sqlResult) => {
              if (err) {
                return reject(err);
              } else {
                logger("**** Removed Session ****");
                return resolve(agent.add(`I am sorry, We currently support cities/districts mentioned here. ${formatCitiesArray(availableCities)}Please try again!!`));
              }
            });
            */
          }
          hospitalDataMongo.findOne({ "city/district": city }, (err, dbResult) => {
            if (err) {
              return reject(err);
            } else {
              if (dbResult) {
                //Sort the arr
                dbResult.data.sort((a, b) => (parseInt(a[bedType]) > parseInt(b[bedType]) ? -1 : 1));
                //format final output
                const responseStr = formatStrFromObj(dbResult, messagesLimit, indexValue);
                let responesObj = {};
                responesObj.text = responseStr;
                responesObj.media = [];
                return resolve(agent.add(JSON.stringify(responesObj)));
              }
            }
          });
        }
      }
    });
  });
}

function getAvailableBeds__more(agent) {
  return new Promise((resolve, reject) => {
    logger("****** getAvaigetAvailableBeds__morelableBeds intent triggered ******");
    /* extract the parameters from agent */
    const session_vars = agent.context.get("session_vars").parameters;
    logger("**** session_vars ****", session_vars);
    /* extract agent session id from params */
    const agentSession = agent.session.slice(agent.session.length - 36);
    logger("******* agent session ******** ", agentSession);
    const messagesLimit = 3;
    let city = session_vars.location.location == null ? session_vars.location : session_vars.location.location.city;
    city = city.toLowerCase();
    city = city[0].toUpperCase() + city.substring(1, city.length);
    const bedType = session_vars.bedType;
    let indexValue;

    /* SQL query to fet dialoflow sessoin data */
    const sqlQuery = "SELECT * FROM dialogflowsession WHERE (sessionID = " + `'${agentSession}');`;
    connection.query(sqlQuery, (err, sqlResult) => {
      if (err) {
        return reject(err);
      } else {
        if (sqlResult.length > 0) {
          indexValue = parseInt(sqlResult[0].counter_variable) + messagesLimit;
          hospitalDataMongo.findOne({ "city/district": city }, (err, dbResult) => {
            if (err) {
              return reject(err);
            } else {
              /* Check if query is in avaialbleCities */
              if (!availableCities.includes(city)) {
                return resolve(agent.add(`I am sorry, We currently support *Cities/Districts* mentioned here. ${formatCitiesArray(availableCities)}. Please try again!!`));
              }
              //Sort the arr
              dbResult.data.sort((a, b) => (parseInt(a[bedType]) > parseInt(b[bedType]) ? -1 : 1));
              //format final output
              const responseStr = formatStrFromObj(dbResult, messagesLimit, parseInt(indexValue));
              const sqlQuery = `UPDATE dialogflowsession SET counter_variable = '${parseInt(indexValue)}' WHERE (sessionID = '${agentSession}');`;
              connection.query(sqlQuery, (err, sqlResult) => {
                if (err) {
                  return reject(err);
                } else {
                  logger("*** UPDATED INDEX VALUE *****");
                  let responesObj = {};
                  responesObj.text = responseStr;
                  responesObj.media = [];
                  return resolve(agent.add(JSON.stringify(responesObj)));
                }
              });
            }
          });
        }
      }
    });
  });
}

function getAvailableBeds__cancel(agent) {
  return new Promise((resolve, reject) => {
    logger("****** getAvailableBeds__cancel intent triggered ******");
    /* extract agent session id from params */
    const agentSession = agent.session.slice(agent.session.length - 36);
    logger("******* agent session ******** ", agentSession);
    /* SQL query to fet dialoflow sessoin data */
    const sqlQuery = "SELECT * FROM dialogflowsession WHERE (sessionID = " + `'${agentSession}');`;

    connection.query(sqlQuery, (err, sqlResult) => {
      if (err) {
        return reject(err);
      } else {
        if (sqlResult.length > 0) {
          /* SQL query to delete the dialoflow session */
          const sqlQuery = "DELETE FROM dialogflowsession WHERE (sessionID = " + `'${agentSession}');`;

          connection.query(sqlQuery, (err, sqlResult) => {
            if (err) {
              return reject(err);
            } else {
              let responesObj = {};
              responesObj.text = "Sure, thank you for using our service! 🙏🏻";
              responesObj.media = [];
              return resolve(agent.add(JSON.stringify(responesObj)));
            }
          });
        }
      }
    });
  });
}

function formatTweet(data, limit) {
  let formattedStr = "*Latest Tweets on Covid19* \n \n";
  let dataArr = data.statuses;
  let tweetUsers = new Set();
  let finalLimit = dataArr.length <= limit ? dataArr.length : limit;
  for (let i = 0; i < finalLimit; i++) {
    if (!tweetUsers.has(dataArr[i].user.name)) {
      try {
        formattedStr += "*Created At*: " + moment(dataArr[i].created_at).format("YYYY-MM-DD h:mm a") + "\n";
      } catch {
        formattedStr += "*Created At*: N/A" + "\n";
      }
      formattedStr += "*Created By*: " + dataArr[i].user.name + "\n";
      formattedStr += "*Tweet*: " + dataArr[i].text.replaceAll("\n", "pm") + "\n";
      formattedStr += "------------------------- \n";
    }
    tweetUsers.add(dataArr[i].user.name);
  }
  formattedStr += "*Source*: https://twitter.com";
  return dataArr.length == 0 ? "No Latest tweets...🙁" : formattedStr;
}

function getTweets(agent) {
  return new Promise((resolve, reject) => {
    logger("**** getTweets intent triggered *****");
    var params = {
      q: `covid19 since: ${moment().subtract(24, "hours").format("YYYY-MM-DD")}`,
      count: 100,
    };
    T.get("search/tweets", params, (err, data, response) => {
      if (err) {
        return reject(err);
      }
      //console.log(JSON.stringify(data));
      logger("Tweets Length: ", data.statuses.length);
      let responesObj = {};
      responesObj.text = formatTweet(data, 5);
      responesObj.media = [];
      return resolve(agent.add(JSON.stringify(responesObj)));
    });
  });
}

function getGuideLines(agent) {
  return new Promise((resolve, reject) => {
    logger("****** GetGuideLines Received ******");
    let formattedStr = "";
    formattedStr += "*What to do to keep yourself and others safe from COVID-19* \n";
    formattedStr += "*1.* Maintain at least a 1-metre distance between yourself and others to reduce your risk of infection when they cough, sneeze or speak. Maintain an even greater distance between yourself and others when indoors. The further away, the better. \n";
    formattedStr += "*2.* Make wearing a mask a normal part of being around other people. The appropriate use, storage and cleaning or disposal are essential to make masks as effective as possible. \n";
    formattedStr += "*3.* Avoid crowded or indoor settings but if you can’t, then take precautions \n";

    let mediaUrlsTemp = ["https://covidbotbytebook.s3.amazonaws.com/Images/covidhelp1.png", "https://covidbotbytebook.s3.amazonaws.com/Images/covidhelp2.png", "https://covidbotbytebook.s3.amazonaws.com/Images/covidhelp3.jpeg"];
    let urlsIndex = Math.floor(Math.random() * mediaUrlsTemp.length) + 0;
    //let mediaUrls = [];
    let mediaUrls = [mediaUrlsTemp[urlsIndex]];
    let responesObj = {};
    responesObj.text = formattedStr;
    responesObj.media = mediaUrls;
    return resolve(agent.add(JSON.stringify(responesObj)));
  });
}

function welcomeIntent(agent) {
  return new Promise((resolve, reject) => {
    logger("***** welcomeIntent triggered ****");
    let formattedStr = "";
    formattedStr += "Hi, I am Neuro your covid help assistant. I can help you with the below mentioned services, just reply the service name to get started. \n";
    formattedStr += `- Available beds.\n- Covid Cases.\n- Tweets.\n- Guidelines.\n- Articles.\n- Resources (Other website resources).\n- Oxygen Cylinders, Plasma.\n- Disclaimer.\n- Cancel (to stop conversation at any moment).\n- Give feedback.\n\n*Disclaimer:* Data is not owned or created by us (to know more reply 'Disclaimer')\n\nPlease save this contact to avoid hassle.\n\n*Note*: Your session will be closed if you are idle for more than 5 minutes.\n\nWe believe privacy is at most important. Your messages are not stored for any use after your session.\n\nWebsite: https://bytebook.co \n\nJAI HIND 🙏🏻🇮🇳`;
    let mediaUrls = [`https://covidbotbytebook.s3.amazonaws.com/Images/covidWelcome-min.png`];
    //let mediaUrls = [];
    let responesObj = {};
    responesObj.text = formattedStr;
    responesObj.media = mediaUrls;
    return resolve(agent.add(JSON.stringify(responesObj)));
  });
}

function getArticles(agent) {
  return new Promise((resolve, reject) => {
    logger("***** getArticles triggered ****");
    let formattedStr = "*Useful Articles to Read*🧐 \n \n";
    formattedStr += "https://www.euro.who.int/en/health-topics/health-emergencies/coronavirus-covid-19/publications-and-technical-guidance/noncommunicable-diseases/stay-physically-active-during-self-quarantine#:~:text=Side%20knee%20lifts,your%20heart%20and%20breathing%20rates. \n";
    formattedStr += "------------------------- \n";
    formattedStr += "https://www.who.int/emergencies/diseases/novel-coronavirus-2019/advice-for-public/myth-busters \n";
    formattedStr += "------------------------- \n";
    formattedStr += "https://extranet.who.int/dataformv3/index.php/641777?lang=en \n";
    formattedStr += "------------------------- \n";
    formattedStr += "https://www.cdc.gov/coronavirus/2019-ncov/prevent-getting-sick/prevention.html \n";
    formattedStr += "------------------------- \n";
    formattedStr += "Stay safe and protect yourself 😷";
    let mediaUrls = [];
    let responesObj = {};
    responesObj.text = formattedStr;
    responesObj.media = mediaUrls;
    return resolve(agent.add(JSON.stringify(responesObj)));
  });
}

function getReport(agent) {
  return new Promise((resolve, reject) => {
    logger("***** getReport triggered ****");
    let formattedStr = "*COVID-19 INDIA* \n \n";
    toalCountDataMongo.findOne({ id: "1" }, (err, dbResult) => {
      if (err) {
        return reject(err);
      } else {
        if (dbResult) {
          formattedStr += "*Active:* " + `*${dbResult.Active}*` + "\n";
          formattedStr += "*Discharged:* " + `*${dbResult.Discharged}*` + "\n";
          formattedStr += "*Deaths:* " + `*${dbResult.Deaths}*` + "\n\n";
          formattedStr += "*Resource:* " + "https://www.mohfw.gov.in/" + "\n\n";
          formattedStr += "Check this for some greate graphs -> https://www.covid19india.org/ \n\n";
          formattedStr += "Stay safe and protect yourself 😷";
          let mediaUrls = [];
          let responesObj = {};
          responesObj.text = formattedStr;
          responesObj.media = mediaUrls;
          return resolve(agent.add(JSON.stringify(responesObj)));
        }
      }
    });
  });
}

function getTweets2(agent) {
  return new Promise((resolve, reject) => {
    logger("***** getTweets2 triggered ****");
    // const session_vars = agent.context.get("session_vars").parameters;
    // console.log("**** session_vars ****", session_vars);
    const parameters = agent.parameters;
    logger("parameters", parameters);
    /* extract agent session id from params */
    const agentSession = agent.session.slice(agent.session.length - 36);
    logger("******* agent session ******** ", agentSession);
    let city;
    city = parameters.location.location == null ? parameters.location : parameters.location.location.city;
    if (city == "") {
      city = "null";
    }
    logger("**** SELECTED CITY ******", city);
    city = city.toLowerCase();
    city = city[0].toUpperCase() + city.substring(1, city.length);
    const serviceType = parameters.serviceType;
    let formattedStr = "";
    const stringID = uuid.v4();
    formattedStr += "Please open this link to check out latest tweets on your query.\n\n";
    let urlString = `https://twitter.com/search?q=${encodeURIComponent(`${city} ("${serviceType}") -"not verified" -"un verified" -"urgent" -"unverified" -"needed" -"required" -"need" -"needs" -"requirement" -"Any verified lead" since:${moment().subtract(5, "days").format("YYYY-MM-DD")}`)}&f=live`;
    formattedStr += `https://bytebook.co/api/tweets/?q=${stringID}`;
    formattedStr += "\n\nThis link will we deleted after few days.";
    if (serviceType == "Plasma") {
      formattedStr += "\n\nIf above link was not helpful. Try in the following webistes: \n - https://plasmadonor.in/ \n - https://plasmaline.in/";
    }
    formattedStr += "\n\nStay safe and protect yourself 😷";
    const sqlQuery = `INSERT INTO twilio.shortUrls (stringID, urlString, timestamp) VALUES ('${stringID}', '${urlString}', '${moment().format("YYYY-MM-DD  HH:mm:ss.000")}');`;
    connection.query(sqlQuery, (err, sqlResult) => {
      if (err) {
        logger(err);
      } else {
        let mediaUrls = [];
        let responesObj = {};
        responesObj.text = formattedStr;
        responesObj.media = mediaUrls;
        return resolve(agent.add(JSON.stringify(responesObj)));
      }
    });
  });
}

module.exports = {
  getAvailableBeds,
  getAvailableBeds__more,
  getAvailableBeds__cancel,
  getTweets,
  getGuideLines,
  welcomeIntent,
  getArticles,
  getReport,
  getTweets2,
};
