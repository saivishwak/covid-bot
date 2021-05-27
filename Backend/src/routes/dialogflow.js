/*  --------- Dialogflow Routes for Dialogflow AI ------------
    Development done in vsCode and formatting with prettier
    This source code belongs to ByteBook.co Any use of this code outside ByteBook.co is not
    allowed.
*/

// Import libraries
const express = require("express");
const router = express.Router();
const { WebhookClient } = require("dialogflow-fulfillment");

// Util imports
const { getAvailableBeds, getAvailableBeds__more, getAvailableBeds__cancel, getTweets, getReport, getTweets2, getGuideLines, welcomeIntent, getArticles } = require("../utils/dialogflowIntents.js");

// DialogFLow webhook Endpoint
router.post("/api/v1/dialogflow/webhook", (req, res) => {
  /* API route which dialogflow Webhook calls */
  const agent = new WebhookClient({ request: req, response: res });
  const intentMap = new Map();
  intentMap.set("getAvailableBeds", getAvailableBeds);
  intentMap.set("getAvailableBeds - more", getAvailableBeds__more);
  intentMap.set("getAvailableBeds - cancel", getAvailableBeds__cancel);
  intentMap.set("getTweets", getTweets);
  intentMap.set("getGuideLines", getGuideLines);
  intentMap.set("welcomeIntent", welcomeIntent);
  intentMap.set("getArticles", getArticles);
  intentMap.set("getReport", getReport);
  intentMap.set("getTweets2", getTweets2);
  agent.handleRequest(intentMap);
});

module.exports = router;
