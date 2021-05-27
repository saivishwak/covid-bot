/*  --------- Twilio Routes for Dialogflow AI ------------
    Development done in vsCode and formatting with prettier
    This source code belongs to ByteBook.co Any use of this code outside ByteBook.co is not
    allowed.
*/

// Import libraries
const uuid = require("uuid");
const moment = require("moment");
const { MessagingResponse } = require("twilio").twiml;
const axios = require("axios");

// Import libraries
const express = require("express");
const router = express.Router();
const logger = require("../utils/logger.js");

// Util imports
const connection = require("../utils/mysqlDb.js");
const { dialogflowConversation } = require("../utils/util_functions.js");

// DialogFLow webhook Endpoint
router.post("/api/v1/twilio/webhook", (req, res) => {
  /* API route which dialogflow Webhook calls */
  const twiml = new MessagingResponse();
  logger("***** Twilio Webhook Called ******");
  const fromNumber = req.body.From;
  const ProfileName = req.body.ProfileName;
  const messageBody = req.body.Body;
  const timeZone = "Asia/kolkatta";

  /* sql query to check if dialogflow session exists */
  const sqlQuery = "SELECT * FROM dialogflowsession WHERE (fromNumber = " + `'${fromNumber}');`;

  connection.query(sqlQuery, (err, sqlResult) => {
    if (err) {
      logger(err);
      return res.send("Something went wrong. Pleas etry again!");
    } else if (sqlResult.length == 0) {
      //Session Does not exists
      logger("**** Session Does not exists *****");
      const sessionId = uuid.v4();
      /* SQL Query to insert inbound data to sialogfloe session */
      const sqlQuery =
        "INSERT INTO `dialogflowsession` (`sessionId`, `fromNumber`,`profileName`,`messageBody`,`context`,`timestamp`, `counter_variable`)" +
        `VALUES ('${sessionId}','${fromNumber}', '${ProfileName}','${messageBody}','${JSON.stringify(null)}' ,'${new moment().format("YYYY-MM-DD  HH:mm:ss.000")}', '0')`;

      connection.query(sqlQuery, (err, sqlResult2) => {
        if (err) {
          logger(err);
          return res.send("Something went wrong. Pleas etry again!");
        } else {
          dialogflowConversation(sessionId, JSON.stringify(null), messageBody, timeZone)
            .then((dialogflow_result) => {
              const sqlQuery = `UPDATE dialogflowsession SET context = '${JSON.stringify(dialogflow_result.outputContexts)}', timestamp = '${new moment().format("YYYY-MM-DD  HH:mm:ss.000")}' WHERE fromNumber  = ${`"/${fromNumber}"`};`;
              connection.query(sqlQuery, (err, sqlResult) => {
                if (err) {
                  logger(err);
                  /* log err if something bad happens */
                  logger(err);
                } else {
                  let replyMessageBody;
                  try {
                    replyMessageBody = JSON.parse(dialogflow_result.fulfillmentText);
                    logger("parsed Data");
                  } catch {
                    replyMessageBody = dialogflow_result.fulfillmentText;
                    logger("Could not parsed Data");
                  }
                  logger("***** Sending Reply Back ****** ", replyMessageBody);
                  let twimlMessage;
                  if (replyMessageBody.text) {
                    twimlMessage = new MessagingResponse().message(replyMessageBody.text);
                  } else {
                    twimlMessage = new MessagingResponse().message(replyMessageBody);
                  }
                  if (replyMessageBody.media) {
                    if (replyMessageBody.media.length > 0) {
                      twimlMessage.media(replyMessageBody.media[0]);
                    }
                  }
                  res.set("Content-Type", "text/xml");
                  res.send(twimlMessage.toString()).status(200);
                }
              });
            })
            .catch((err) => {
              logger(err);
              // res.status(500).send(err);
            });
        }
      });
    } else {
      //Session exists
      logger("****** Session exists *****", sqlResult);
      dialogflowConversation(sqlResult[0].sessionId, sqlResult[0].context, messageBody, timeZone)
        .then((dialogflow_result) => {
          const sqlQuery = `UPDATE dialogflowsession SET context = '${JSON.stringify(dialogflow_result.outputContexts)}', messageBody = '${messageBody}' ,timestamp = '${new moment().format("YYYY-MM-DD  HH:mm:ss.000")}' WHERE fromNumber  = ${`"/${fromNumber}"`};`;
          connection.query(sqlQuery, (err, sqlResult) => {
            if (err) {
              logger(err);
              /* log err if something bad happens */
              logger(err);
            } else {
              let replyMessageBody;
              try {
                replyMessageBody = JSON.parse(dialogflow_result.fulfillmentText);
                logger("parsed Data");
              } catch {
                replyMessageBody = dialogflow_result.fulfillmentText;
                logger("Could not parsed Data");
              }
              logger("***** Sending Reply Back ****** ", replyMessageBody);
              let twimlMessage;
              if (replyMessageBody.text) {
                twimlMessage = new MessagingResponse().message(replyMessageBody.text);
              } else {
                twimlMessage = new MessagingResponse().message(replyMessageBody);
              }
              if (replyMessageBody.media) {
                if (replyMessageBody.media.length > 0) {
                  twimlMessage.media(replyMessageBody.media[0]);
                }
              }
              res.set("Content-Type", "text/xml");
              res.send(twimlMessage.toString()).status(200);
            }
          });
        })
        .catch((err) => {
          logger(err);
          // res.status(500).send(err);
        });
    }
  });
});

router.get("/api/v1/twilio", (req, res) => {
  logger("*** twilio get Webhook called ****");
  let twimlMessage = new MessagingResponse().message("").media("https://covidbotbytebook.s3.amazonaws.com/Images/covidWelcome-min.png");
  res.writeHead(200, { "Content-Type": "image/png" });
  res.end(twimlMessage.toString());
});

router.post("/api/v1/twilio/statusWebhook/", (req, res) => {
  logger("*** status Webhook called ****", req.body);
  res.writeHead(200, { "Content-Type": "text/xml" });
  res.end("<Response />");
});

router.post("/api/v1/maytapi/webhook", (req, res) => {
  logger("*** maytapi Webhook called ****", req.body);
  res.sendStatus(200);
  if (req.body.type == "error" || req.body.type == "ack" || req.body.type == "status") {
    return;
  }
  let { message, conversation, conversation_name, reply } = req.body;
  let { type, text, fromMe } = message;
  console.log(message, conversation, type, text, fromMe);
  if (fromMe == true) {
    return;
  }
  const fromNumber = conversation;
  const ProfileName = conversation_name;
  const messageBody = text;
  const timeZone = "Asia/kolkatta";
  const replyUrl = reply;

  /* sql query to check if dialogflow session exists */
  const sqlQuery = "SELECT * FROM dialogflowsession WHERE (fromNumber = " + `'${fromNumber}');`;

  connection.query(sqlQuery, (err, sqlResult) => {
    if (err) {
      logger(err);
    } else if (sqlResult.length == 0) {
      //Session Does not exists
      logger("**** Session Does not exists *****");
      const sessionId = uuid.v4();
      /* SQL Query to insert inbound data to sialogfloe session */
      const sqlQuery =
        "INSERT INTO `dialogflowsession` (`sessionId`, `fromNumber`,`profileName`,`messageBody`,`context`,`timestamp`, `counter_variable`)" +
        `VALUES ('${sessionId}','${fromNumber}', '${ProfileName}','${messageBody}','${JSON.stringify(null)}' ,'${new moment().format("YYYY-MM-DD  HH:mm:ss.000")}', '0')`;

      connection.query(sqlQuery, (err, sqlResult2) => {
        if (err) {
          logger(err);
        } else {
          dialogflowConversation(sessionId, JSON.stringify(null), messageBody, timeZone)
            .then((dialogflow_result) => {
              const sqlQuery = `UPDATE dialogflowsession SET context = '${JSON.stringify(dialogflow_result.outputContexts)}', timestamp = '${new moment().format("YYYY-MM-DD  HH:mm:ss.000")}' WHERE fromNumber  = ${`"/${fromNumber}"`};`;
              connection.query(sqlQuery, (err, sqlResult) => {
                if (err) {
                  logger(err);
                  /* log err if something bad happens */
                  logger(err);
                } else {
                  let replyMessageBody;
                  try {
                    replyMessageBody = JSON.parse(dialogflow_result.fulfillmentText);
                    logger("parsed Data");
                  } catch {
                    replyMessageBody = dialogflow_result.fulfillmentText;
                    logger("Could not parsed Data");
                  }
                  logger("***** Sending Reply Back ****** ", replyMessageBody);
                  let twimlMessage = {};
                  twimlMessage["to_number"] = fromNumber;
                  if (replyMessageBody.text) {
                    twimlMessage["message"] = replyMessageBody.text;
                  } else {
                    twimlMessage["message"] = replyMessageBody;
                  }
                  twimlMessage["type"] = "text";
                  if (replyMessageBody.media) {
                    if (replyMessageBody.media.length > 0) {
                      twimlMessage["type"] = "media";
                      twimlMessage["text"] = twimlMessage["message"];
                      twimlMessage["message"] = replyMessageBody.media[0];
                    } else {
                      twimlMessage["type"] = "text";
                    }
                  }
                  axios
                    .post(replyUrl, twimlMessage, {
                      headers: {
                        "x-maytapi-key": "*****",
                        "Content-Type": "application/json",
                      },
                    })
                    .then((data) => {
                      console.log("sent message", data.status);
                    })
                    .catch((err) => {
                      console.log(err);
                    });
                }
              });
            })
            .catch((err) => {
              logger(err);
              // res.status(500).send(err);
            });
        }
      });
    } else {
      //Session exists
      logger("****** Session exists *****", sqlResult);
      dialogflowConversation(sqlResult[0].sessionId, sqlResult[0].context, messageBody, timeZone)
        .then((dialogflow_result) => {
          const sqlQuery = `UPDATE dialogflowsession SET context = '${JSON.stringify(dialogflow_result.outputContexts)}', messageBody = '${messageBody}' ,timestamp = '${new moment().format("YYYY-MM-DD  HH:mm:ss.000")}' WHERE fromNumber  = ${`"/${fromNumber}"`};`;
          connection.query(sqlQuery, (err, sqlResult) => {
            if (err) {
              logger(err);
              /* log err if something bad happens */
              logger(err);
            } else {
              let replyMessageBody;
              try {
                replyMessageBody = JSON.parse(dialogflow_result.fulfillmentText);
                logger("parsed Data");
              } catch {
                replyMessageBody = dialogflow_result.fulfillmentText;
                logger("Could not parsed Data");
              }
              logger("***** Sending Reply Back ****** ", replyMessageBody);
              let twimlMessage = {};
              twimlMessage["to_number"] = fromNumber;
              if (replyMessageBody.text) {
                twimlMessage["message"] = replyMessageBody.text;
              } else {
                twimlMessage["message"] = replyMessageBody;
              }
              twimlMessage["type"] = "text";
              if (replyMessageBody.media) {
                if (replyMessageBody.media.length > 0) {
                  twimlMessage["type"] = "media";
                  twimlMessage["text"] = twimlMessage["message"];
                  twimlMessage["message"] = replyMessageBody.media[0];
                } else {
                  twimlMessage["type"] = "text";
                }
              }
              axios
                .post(replyUrl, twimlMessage, {
                  headers: {
                    "x-maytapi-key": "*****",
                    "Content-Type": "application/json",
                  },
                })
                .then((data) => {
                  console.log("sent message", data.status);
                })
                .catch((err) => {
                  console.log(err);
                });
            }
          });
        })
        .catch((err) => {
          logger(err);
          // res.status(500).send(err);
        });
    }
  });
});

module.exports = router;
